import App from 'App';
import isEqual from 'lodash/isEqual';
import { useRecoilState, useSetRecoilState } from 'recoil';

import { useAuth } from 'hooks/auth';
import { useApi } from 'hooks/useApi';

import { IProjectSettings, projectSettingsState } from 'state/project';
import { settingsState } from 'state/settings';

export default function AppWrapper() {
  const [projectSettings, setProjectSettings] =
    useRecoilState(projectSettingsState);
  const setAppSettings = useSetRecoilState(settingsState);
  const { isAuthenticated, isReady } = useAuth();

  const { data } = useApi<IProjectSettings>(
    projectSettings === undefined && isAuthenticated
      ? '/project/settings'
      : null
  );

  if (
    isReady &&
    !isAuthenticated &&
    window.location.pathname !== '/login' &&
    window.location.pathname !== '/login/callback'
  ) {
    window.location.href = '/login';
  }

  if (data && !isEqual(data, projectSettings)) {
    setProjectSettings(data);
    setAppSettings((prev) => ({
      ...prev,
      defaultCollapseContent: data.ui.default_collapse_content ?? true,
      expandAll: !!data.ui.default_expand_messages,
      hideCot: !!data.ui.hide_cot
    }));
  }

  if (!isReady) {
    return null;
  }

  return <App />;
}
