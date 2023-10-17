import { getToken, removeToken, setToken } from 'helpers/localStorageToken';
import jwt_decode from 'jwt-decode';
import { useRecoilState, useSetRecoilState } from 'recoil';
import useSWRImmutable from 'swr/immutable';
import { useIsFirstRender } from 'usehooks-ts';

import { conversationsHistoryState } from 'state/conversations';
import { accessTokenState, userState } from 'state/user';

import { IAppUser } from 'types/user';

import { fetcher } from './useApi';

export const useAuth = () => {
  const { data: config, isLoading: isLoadingConfig } = useSWRImmutable<{
    requireLogin: boolean;
    passwordAuth: boolean;
    headerAuth: boolean;
    oauthProviders: string[];
  }>('/auth/config', fetcher);
  const isFirstRender = useIsFirstRender();

  const [accessToken, setAccessToken] = useRecoilState(accessTokenState);
  const setConversationsHistory = useSetRecoilState(conversationsHistoryState);
  const [user, setUser] = useRecoilState(userState);

  const isReady = !!(!isLoadingConfig && config);

  const logout = () => {
    setUser(null);
    removeToken();
    setAccessToken('');
    setConversationsHistory(undefined);
  };

  const saveAndSetToken = (token: string | null | undefined) => {
    if (!token) {
      logout();
      return;
    }
    try {
      const { exp, ...AppUser } = jwt_decode(token) as any;
      setToken(token);
      setAccessToken(`Bearer ${token}`);
      setUser(AppUser as IAppUser);
    } catch (e) {
      console.error(
        'Invalid token, clearing token from local storage',
        'error:',
        e
      );
      logout();
    }
  };

  if (isFirstRender && !user && getToken()) {
    // Initialize the token from local storage
    saveAndSetToken(getToken());
  }

  const isAuthenticated = !!accessToken;

  if (config && !config.requireLogin) {
    return {
      config,
      user: null,
      role: 'ANONYMOUS',
      isReady,
      isAuthenticated: true,
      accessToken: '',
      logout: () => {},
      setAccessToken: () => {}
    };
  }

  return {
    config,
    user: user,
    role: user?.role,
    isAuthenticated,
    isReady,
    accessToken: accessToken,
    logout: logout,
    setAccessToken: saveAndSetToken
  };
};
