import { Tabs } from 'expo-router';
import { FloatingTabBar } from '../../components/FloatingTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={props => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="monitor"   />
      <Tabs.Screen name="qr-medico" />
      <Tabs.Screen name="assistant" />
      <Tabs.Screen name="files"     />
      <Tabs.Screen name="profile"   />
    </Tabs>
  );
}
