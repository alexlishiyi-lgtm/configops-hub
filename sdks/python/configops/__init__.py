"""
ConfigOps Hub SDK — Python

3 行代码接入配置中心，支持 ETag 缓存、自动轮询、本地缓存。

Example:
    from configops import ConfigOps

    config = ConfigOps(
        api_key='cop_xxxxxxxx',
        base_url='https://app.configops.dev',
        env='PROD',
    )

    configs = config.fetch()
    print(configs['database.host'])  # 'localhost'
"""

import threading
import time
from typing import Optional, Dict, Callable
import requests


class ConfigOpsError(Exception):
    """ConfigOps SDK base error."""
    pass


class ConfigOps:
    def __init__(
        self,
        api_key: str,
        base_url: str = 'http://localhost:3000',
        env: str = 'DEV',
        poll_interval: float = 30.0,
        timeout: float = 5.0,
    ):
        """
        Initialize ConfigOps SDK.

        Args:
            api_key: API Key from ConfigOps Hub settings page.
            base_url: ConfigOps Hub server URL.
            env: Environment (DEV, TEST, PROD).
            poll_interval: Auto-poll interval in seconds. Set to 0 to disable.
            timeout: Request timeout in seconds.
        """
        if not api_key or not api_key.startswith('cop_'):
            raise ValueError('API Key must start with "cop_"')

        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.env = env
        self.poll_interval = poll_interval
        self.timeout = timeout

        self._cached_configs: Optional[Dict[str, str]] = None
        self._etag: Optional[str] = None
        self._poll_thread: Optional[threading.Thread] = None
        self._poll_stop = threading.Event()
        self._lock = threading.Lock()

    def fetch(self) -> Dict[str, str]:
        """
        Fetch configs. Uses ETag caching — if configs haven't changed,
        returns local cache (nearly zero overhead).
        """
        headers = {'Authorization': f'Bearer {self.api_key}'}
        if self._etag:
            headers['If-None-Match'] = self._etag

        try:
            response = requests.get(
                f'{self.base_url}/api/sdk/configs',
                params={'env': self.env},
                headers=headers,
                timeout=self.timeout,
            )

            if response.status_code == 304:
                return self._cached_configs or {}

            if response.status_code == 401:
                raise ConfigOpsError('Invalid API key')

            if response.status_code == 403:
                raise ConfigOpsError('API key has been revoked')

            if not response.ok:
                raise ConfigOpsError(f'Failed to fetch configs: {response.status_code}')

            data = response.json()

            with self._lock:
                self._cached_configs = data.get('configs', {})
                self._etag = data.get('etag') or response.headers.get('etag')

            return self._cached_configs

        except requests.exceptions.Timeout:
            raise ConfigOpsError('Request timeout')
        except requests.exceptions.ConnectionError:
            raise ConfigOpsError('Connection failed')

    def get(self, key: str) -> Optional[str]:
        """Get a single config value. Fetches if cache is empty."""
        if self._cached_configs is None:
            self.fetch()
        return self._cached_configs.get(key) if self._cached_configs else None

    def get_sync(self, key: str) -> Optional[str]:
        """Get a single config value from cache (no fetch). Returns None if cache is empty."""
        return self._cached_configs.get(key) if self._cached_configs else None

    def start_polling(self, on_updated: Optional[Callable[[Dict[str, str]], None]] = None) -> None:
        """Start auto-polling in a background thread."""
        if self._poll_thread and self._poll_thread.is_alive():
            return

        self._poll_stop.clear()

        def _poll():
            while not self._poll_stop.is_set():
                previous_etag = self._etag
                try:
                    configs = self.fetch()
                    if self._etag != previous_etag and on_updated:
                        on_updated(configs)
                except Exception:
                    pass  # Silently ignore polling errors

                self._poll_stop.wait(self.poll_interval)

        self._poll_thread = threading.Thread(target=_poll, daemon=True)
        self._poll_thread.start()

    def stop_polling(self) -> None:
        """Stop auto-polling."""
        self._poll_stop.set()
        if self._poll_thread:
            self._poll_thread.join(timeout=2)
            self._poll_thread = None

    def clear_cache(self) -> None:
        """Clear local cache."""
        with self._lock:
            self._cached_configs = None
            self._etag = None
