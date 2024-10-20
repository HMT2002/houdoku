import React, { useEffect, useState } from 'react';
import { Series } from '@tiyo/common';
import { useRecoilValue } from 'recoil';
const { ipcRenderer } = require('electron');
import { Button, Group, Modal, NumberInput, Radio, Text } from '@mantine/core';
import ipcChannels from '@/common/constants/ipcChannels.json';
import { customDownloadsDirState } from '@/renderer/state/settingStates';
import { sortedFilteredChapterListState } from '@/renderer/state/libraryStates';
import { downloadAll, downloadNextX } from '@/renderer/features/library/chapterDownloadUtils';
import { queueState } from '@/renderer/state/downloaderStates';

const defaultDownloadsDir = await ipcRenderer.invoke(ipcChannels.GET_PATH.DEFAULT_DOWNLOADS_DIR);

enum DownloadAction {
  NextX,
  Range,
  Unread,
  All,
}

type Props = {
  series: Series;
  visible: boolean;
  close: () => void;
};

const DownloadModal: React.FC<Props> = (props: Props) => {
  const customDownloadsDir = useRecoilValue(customDownloadsDirState);
  const sortedFilteredChapterList = useRecoilValue(sortedFilteredChapterListState);
  const downloadQueue = useRecoilValue(queueState);
  const [downloadNextAmount, setDownloadNextAmount] = useState(5);
  const [downloadRangeStart, setDownloadRangeStart] = useState(1);
  const [downloadRangeEnd, setDownloadRangeEnd] = useState(1);
  const [downloadAction, setDownloadAction] = useState<DownloadAction>(DownloadAction.NextX);

  useEffect(() => {
    if (sortedFilteredChapterList.length === 0) {
      props.close();
      return;
    }

    const lowestUnreadChapter = sortedFilteredChapterList
      .toReversed()
      .find((c) => c.chapterNumber && !c.read);
    setDownloadRangeStart(
      lowestUnreadChapter
        ? parseFloat(lowestUnreadChapter.chapterNumber)
        : parseFloat(sortedFilteredChapterList.toReversed()[0].chapterNumber),
    );
    setDownloadRangeEnd(parseFloat(sortedFilteredChapterList[0].chapterNumber));
  }, [sortedFilteredChapterList]);

  const downloadFunc = () => {
    if (downloadAction === DownloadAction.NextX) {
      downloadNextX(
        sortedFilteredChapterList,
        props.series,
        customDownloadsDir || defaultDownloadsDir,
        downloadQueue,
        downloadNextAmount,
      );
    } else if (downloadAction === DownloadAction.All) {
      downloadAll(
        sortedFilteredChapterList,
        props.series,
        customDownloadsDir || defaultDownloadsDir,
        false,
      );
    } else if (downloadAction === DownloadAction.Unread) {
      downloadAll(
        sortedFilteredChapterList,
        props.series,
        customDownloadsDir || defaultDownloadsDir,
        true,
      );
    } else if (downloadAction === DownloadAction.Range) {
      const chaptersInRange = sortedFilteredChapterList.filter((c) => {
        const parsedNum = parseFloat(c.chapterNumber);
        if (isNaN(parsedNum)) return false;
        return parsedNum >= downloadRangeStart && parsedNum <= downloadRangeEnd;
      });
      downloadAll(chaptersInRange, props.series, customDownloadsDir || defaultDownloadsDir);
    }

    props.close();
  };

  const renderDownloadNextX = () => {
    const active = downloadAction === DownloadAction.NextX;
    return (
      <Radio
        checked={active}
        onChange={() => setDownloadAction(DownloadAction.NextX)}
        styles={{ inner: { alignSelf: 'center' } }}
        mb={4}
        label={
          <Group gap={5}>
            <Text size="sm" mr={4}>
              Download next
            </Text>
            <NumberInput
              disabled={!active}
              value={downloadNextAmount}
              min={0}
              onChange={(value) =>
                typeof value === 'number' ? setDownloadNextAmount(value) : setDownloadNextAmount(0)
              }
              size="xs"
              styles={{ input: { width: 54, textAlign: 'center' } }}
            />
            <Text size="sm" ml={4}>
              chapters
            </Text>
          </Group>
        }
      />
    );
  };

  const renderDownloadRange = () => {
    const active = downloadAction === DownloadAction.Range;
    return (
      <Radio
        checked={active}
        onChange={() => setDownloadAction(DownloadAction.Range)}
        styles={{ inner: { alignSelf: 'center' } }}
        mb={4}
        label={
          <Group gap={5}>
            <Text size="sm" mr={4}>
              Download chapters
            </Text>
            <NumberInput
              disabled={!active}
              value={downloadRangeStart}
              min={0}
              onChange={(value) =>
                typeof value === 'number' ? setDownloadRangeStart(value) : setDownloadRangeStart(0)
              }
              size="xs"
              styles={{ input: { width: 54, textAlign: 'center' } }}
            />
            <Text size="sm" ml={4} mr={4}>
              through
            </Text>
            <NumberInput
              disabled={!active}
              value={downloadRangeEnd}
              min={0}
              onChange={(value) =>
                typeof value === 'number' ? setDownloadRangeEnd(value) : setDownloadRangeEnd(0)
              }
              size="xs"
              styles={{ input: { width: 54, textAlign: 'center' } }}
            />
          </Group>
        }
      />
    );
  };

  const renderDownloadUnread = () => {
    const active = downloadAction === DownloadAction.Unread;
    return (
      <Radio
        checked={active}
        onChange={() => setDownloadAction(DownloadAction.Unread)}
        mb={4}
        label={'Download unread chapters'}
      />
    );
  };

  const renderDownloadAll = () => {
    const active = downloadAction === DownloadAction.All;
    return (
      <Radio
        checked={active}
        onChange={() => setDownloadAction(DownloadAction.All)}
        label={'Download all chapters'}
      />
    );
  };

  return (
    <Modal opened={props.visible} centered title="Download chapters" onClose={props.close}>
      {renderDownloadNextX()}
      {renderDownloadRange()}
      {renderDownloadUnread()}
      {renderDownloadAll()}

      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={props.close}>
          Cancel
        </Button>
        <Button onClick={downloadFunc}>Download</Button>
      </Group>
    </Modal>
  );
};

export default DownloadModal;
