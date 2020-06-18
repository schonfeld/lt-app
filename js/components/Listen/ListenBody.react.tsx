import React, {useRef, useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {Icon} from 'react-native-elements';
import {TouchableNativeFeedback} from 'react-native-gesture-handler';
import RBSheet from 'react-native-raw-bottom-sheet';
import ListenBottomSheet from './ListenBottomSheet.react';
import {useCourseContext} from '../Context/CourseContext';
import {useLessonContext} from '../Context/LessonContext';
import ListenScrubber from './ListenScrubber.react';
import DownloadManager from '../../download-manager';
import {useProgress} from 'react-native-track-player';
import {log} from '../../metrics';

interface IProps {
  setBottomSheetOpen: (val: boolean) => void;
  skipBack: Callback;
  seekTo: CallbackWithParam<number>;
  toggle: Callback;
  ready: boolean;
  playing: boolean;
}

const ListenBody = ({
  setBottomSheetOpen,
  skipBack,
  seekTo,
  toggle,
  ready,
  playing,
}: IProps) => {
  const {position} = useProgress();
  const bottomSheet = useRef<RBSheet>(null!);

  const {course, courseData} = useCourseContext();
  const {lesson, lessonData} = useLessonContext();

  const [downloaded, setDownloaded] = useState<boolean>(false);
  useEffect(() => {
    (async () => {
      const resp = await DownloadManager.genIsDownloaded(course, lesson);
      setDownloaded(resp);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (downloaded === null) {
    return (
      <ActivityIndicator
        size={64}
        style={styles.loader}
        color={courseData.uiColors.text}
      />
    );
  }

  const smallIconSize = 0.175 * Dimensions.get('screen').width;
  const largeIconSize = 0.4 * Dimensions.get('screen').width;

  return (
    <>
      <View
        style={[
          styles.body,
          {
            backgroundColor: courseData.uiColors.background,
          },
        ]}>
        <View style={styles.lessonName}>
          <Text style={[styles.courseTitle, {color: courseData.uiColors.text}]}>
            {courseData.shortTitle}
          </Text>
          <Text style={[styles.lesson, {color: courseData.uiColors.text}]}>
            {lessonData.title}
          </Text>
        </View>

        <View style={styles.icons}>
          <TouchableNativeFeedback
            // @ts-ignore
            background={TouchableNativeFeedback.Ripple(null, true)}
            onPress={skipBack}>
            <Icon
              name="replay-10"
              type="material"
              accessibilityLabel="skip backwards ten seconds"
              size={smallIconSize}
              color={courseData.uiColors.text}
            />
          </TouchableNativeFeedback>
          {ready || playing ? (
            <TouchableNativeFeedback
              // @ts-ignore
              background={TouchableNativeFeedback.Ripple(null, true)}
              onPress={toggle}>
              <Icon
                name={playing ? 'pause' : 'play-arrow'}
                accessibilityLabel={playing ? 'pause' : 'play'}
                type="material"
                size={largeIconSize}
                color={courseData.uiColors.text}
              />
            </TouchableNativeFeedback>
          ) : (
            <ActivityIndicator
              size={largeIconSize}
              color={courseData.uiColors.text}
            />
          )}
          <TouchableNativeFeedback
            // @ts-ignore
            background={TouchableNativeFeedback.Ripple(null, true)}
            onPress={() => {
              bottomSheet.current?.open();
            }}>
            <Icon
              name="settings"
              type="material"
              accessibilityLabel="other actions for this lesson"
              size={smallIconSize}
              color={courseData.uiColors.text}
            />
          </TouchableNativeFeedback>
        </View>

        <ListenScrubber seekTo={seekTo} />
      </View>

      <RBSheet
        ref={bottomSheet}
        height={downloaded ? 236 : 164}
        // is there such a prop `duration`?
        // @ts-ignore
        duration={250}
        customStyles={{
          container: {
            borderTopLeftRadius: 15,
            borderTopRightRadius: 15,
          },
        }}
        closeOnDragDown={true}
        onOpen={() => {
          log({
            action: 'open_bottom_sheet',
            surface: 'listen_screen',
            course,
            lesson,
            position,
          });
          setBottomSheetOpen(true);
        }}
        onClose={() => {
          log({
            action: 'close_bottom_sheet',
            surface: 'listen_screen',
            course,
            lesson,
            position,
          });
          setBottomSheetOpen(false);
        }}>
        <ListenBottomSheet downloaded={downloaded} />
      </RBSheet>
    </>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  lessonName: {
    alignItems: 'center',
  },

  courseTitle: {
    fontWeight: 'bold',
    fontSize: 48,
  },
  lesson: {
    fontSize: 32,
  },

  icons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  loader: {
    marginTop: 64,
  },
});

export default ListenBody;