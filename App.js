import React, {useContext, useEffect, useMemo, useState} from 'react';
import {
  LogBox,
  Platform,
  SafeAreaView,
  View,
  useColorScheme,
  I18nManager,
} from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {useHeaderHeight} from '@react-navigation/elements';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {StreamChat} from 'stream-chat';
import {
  Channel,
  ChannelList,
  Chat,
  MessageInput,
  MessageList,
  OverlayProvider,
  Streami18n,
  Thread,
  useAttachmentPickerContext,
  useOverlayContext,
} from 'stream-chat-react-native';

import {useStreamChatTheme} from './useStreamChatTheme';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

LogBox.ignoreAllLogs(true);

I18nManager.forceRTL(false);

const chatClient = StreamChat.getInstance('q95x9hkbyd6p');
const userToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoicm9uIn0.eRVjxLvd4aqCEHY_JRa97g6k7WpHEhxL7Z4K4yTot1c';
const user = {
  id: 'ron',
};

const filters = {
  example: 'example-apps',
  members: {$in: ['ron']},
  type: 'messaging',
};
const sort = {last_message_at: -1};
const options = {
  presence: true,
  state: true,
  watch: true,
  limit: 30,
};

/**
 * Start playing with streami18n instance here:
 * Please refer to description of this PR for details: https://github.com/GetStream/stream-chat-react-native/pull/150
 */
const streami18n = new Streami18n({
  language: 'en',
});

const ChannelListScreen = ({navigation}) => {
  const {setChannel} = useContext(AppContext);

  const memoizedFilters = useMemo(() => filters, []);

  return (
    <View style={{height: '100%'}}>
      <ChannelList
        filters={memoizedFilters}
        onSelect={channel => {
          setChannel(channel);
          navigation.navigate('Channel');
        }}
        options={options}
        sort={sort}
      />
    </View>
  );
};

const ChannelScreen = ({navigation}) => {
  const {channel, setThread, thread} = useContext(AppContext);
  const headerHeight = useHeaderHeight();
  const {setTopInset} = useAttachmentPickerContext();
  const {overlay} = useOverlayContext();

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: Platform.OS === 'ios' && overlay === 'none',
    });
  }, [overlay]);

  useEffect(() => {
    setTopInset(headerHeight);
  }, [headerHeight]);

  return (
    <SafeAreaView>
      <Channel
        channel={channel}
        keyboardVerticalOffset={headerHeight}
        thread={thread}>
        <View style={{flex: 1}}>
          <MessageList
            onThreadSelect={thread => {
              setThread(thread);
              if (channel?.id) {
                navigation.navigate('Thread');
              }
            }}
          />
          <MessageInput />
        </View>
      </Channel>
    </SafeAreaView>
  );
};

const ThreadScreen = ({navigation}) => {
  const {channel, setThread, thread} = useContext(AppContext);
  const headerHeight = useHeaderHeight();
  const {overlay} = useOverlayContext();

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: Platform.OS === 'ios' && overlay === 'none',
    });
  }, [overlay]);

  return (
    <SafeAreaView>
      <Channel
        channel={channel}
        keyboardVerticalOffset={headerHeight}
        thread={thread}
        threadList>
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-start',
          }}>
          <Thread onThreadDismount={() => setThread(null)} />
        </View>
      </Channel>
    </SafeAreaView>
  );
};

const Stack = createStackNavigator();

const AppContext = React.createContext({});

const App = () => {
  const colorScheme = useColorScheme();
  const {bottom} = useSafeAreaInsets();
  const theme = useStreamChatTheme();

  const [channel, setChannel] = useState();
  const [clientReady, setClientReady] = useState(false);
  const [thread, setThread] = useState();

  useEffect(() => {
    const setupClient = async () => {
      await chatClient.connectUser(user, userToken);

      return setClientReady(true);
    };

    setupClient();
  }, []);

  return (
    <NavigationContainer
      theme={{
        colors: {
          ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme).colors,
          background: theme.colors?.white_snow || '#FCFCFC',
        },
        dark: colorScheme === 'dark',
      }}>
      <AppContext.Provider value={{channel, setChannel, setThread, thread}}>
        <GestureHandlerRootView style={{flex: 1}}>
          <OverlayProvider
            bottomInset={bottom}
            i18nInstance={streami18n}
            value={{style: theme}}>
            <Chat client={chatClient} i18nInstance={streami18n}>
              {clientReady && (
                <Stack.Navigator
                  initialRouteName="ChannelList"
                  screenOptions={{
                    headerTitleStyle: {
                      alignSelf: 'center',
                      fontWeight: 'bold',
                    },
                  }}>
                  <Stack.Screen
                    component={ChannelScreen}
                    name="Channel"
                    options={() => ({
                      headerBackTitle: 'Back',
                      headerRight: () => <></>,
                      headerTitle: channel?.data?.name,
                    })}
                  />
                  <Stack.Screen
                    component={ChannelListScreen}
                    name="ChannelList"
                    options={{headerTitle: 'Channel List'}}
                  />
                  <Stack.Screen
                    component={ThreadScreen}
                    name="Thread"
                    options={() => ({headerLeft: () => <></>})}
                  />
                </Stack.Navigator>
              )}
            </Chat>
          </OverlayProvider>
        </GestureHandlerRootView>
      </AppContext.Provider>
    </NavigationContainer>
  );
};

export default () => {
  const theme = useStreamChatTheme();

  return (
    <SafeAreaProvider
      style={{backgroundColor: theme.colors?.white_snow || '#FCFCFC'}}>
      <App />
    </SafeAreaProvider>
  );
};
