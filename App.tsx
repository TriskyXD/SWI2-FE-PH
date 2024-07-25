// App.tsx
import React from 'react';
import AppNavigator from './AppNavigator';

import {TextEncoder} from 'text-encoding';

global.TextEncoder = TextEncoder;

const App = () => {
  return <AppNavigator />;
};

export default App;