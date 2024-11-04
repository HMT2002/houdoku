import React, { useEffect, useState } from 'react';
import { Chapter, Series } from '@tiyo/common';
const { ipcRenderer } = require('electron');
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { Divider, Group, Table } from '@mantine/core';
import ChapterTableContextMenu from './ChapterTableContextMenu';
import ipcChannels from '@/common/constants/ipcChannels.json';
import {
  chapterDownloadStatusesState,
  chapterFilterGroupState,
  chapterFilterTitleState,
  chapterListState,
  sortedFilteredChapterListState,
} from '@/renderer/state/libraryStates';
import {
  chapterLanguagesState,
  customDownloadsDirState,
  chapterListPageSizeState,
  themeState,
} from '@/renderer/state/settingStates';
import { currentTaskState } from '@/renderer/state/downloaderStates';
import ChapterTableHeading from './ChapterTableHeading';
import ChapterTableBody from './ChapterTableBody';
import DefaultTable from '../general/DefaultTable';
import { themeProps } from '@/renderer/util/themes';
import DefaultSelect from '../general/DefaultSelect';
import DefaultPagination from '../general/DefaultPagination';

const defaultDownloadsDir = await ipcRenderer.invoke(ipcChannels.GET_PATH.DEFAULT_DOWNLOADS_DIR);

type Props = {
  series: Series;
};

const ChapterTable: React.FC<Props> = (props: Props) => {
  const theme = useRecoilValue(themeState);
  const chapterFilterTitle = useRecoilValue(chapterFilterTitleState);
  const chapterFilterGroup = useRecoilValue(chapterFilterGroupState);
  const [chapterListPageSize, setChapterListPageSize] = useRecoilState(chapterListPageSizeState);
  const chapterLanguages = useRecoilValue(chapterLanguagesState);
  const customDownloadsDir = useRecoilValue(customDownloadsDirState);
  const [currentPage, setCurrentPage] = useState(1);
  const [showingContextMenu, setShowingContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<{
    x: number;
    y: number;
  }>({
    x: 0,
    y: 0,
  });
  const [contextMenuChapter, setContextMenuChapter] = useState<Chapter | undefined>();
  const downloaderCurrentTask = useRecoilValue(currentTaskState);
  const chapterList = useRecoilValue(chapterListState);
  const sortedFilteredChapterList = useRecoilValue(sortedFilteredChapterListState);
  const setChapterDownloadStatuses = useSetRecoilState(chapterDownloadStatusesState);

  const updateDownloadStatuses = () => {
    ipcRenderer
      .invoke(
        ipcChannels.FILESYSTEM.GET_CHAPTERS_DOWNLOADED,
        props.series,
        chapterList,
        customDownloadsDir || defaultDownloadsDir,
      )
      .then((statuses) => setChapterDownloadStatuses(statuses))
      .catch((err) => console.error(err));
  };

  useEffect(() => setCurrentPage(1), [chapterFilterGroup, chapterFilterTitle, chapterLanguages]);

  useEffect(() => {
    if (downloaderCurrentTask?.page === 2) updateDownloadStatuses();
  }, [downloaderCurrentTask]);

  useEffect(() => {
    if (chapterList.length > 0) updateDownloadStatuses();
  }, [chapterList]);

  return (
    <>
      <ChapterTableContextMenu
        position={contextMenuPosition}
        visible={showingContextMenu}
        series={props.series}
        chapter={contextMenuChapter}
        chapterList={sortedFilteredChapterList}
        close={() => setShowingContextMenu(false)}
      />

      <DefaultTable style={{ cursor: 'pointer', tableLayout: 'fixed' }} verticalSpacing={4}>
        <Table.Thead>
          <ChapterTableHeading series={props.series} />
        </Table.Thead>
        <Table.Tbody {...themeProps(theme)}>
          <ChapterTableBody
            series={props.series}
            page={currentPage}
            handleContextMenu={(event, chapter) => {
              setContextMenuPosition({ x: event.clientX, y: event.clientY });
              setContextMenuChapter(chapter);
              setShowingContextMenu(true);
            }}
          />
        </Table.Tbody>
      </DefaultTable>

      <Divider mb="sm" />

      <Group justify="flex-end" gap="md" mb="xl">
        <DefaultPagination
          size="sm"
          value={currentPage}
          onChange={setCurrentPage}
          total={Math.ceil(sortedFilteredChapterList.length / chapterListPageSize)}
        />
        <DefaultSelect
          w={100}
          size="xs"
          value={`${chapterListPageSize}`}
          data={[10, 20, 50, 100].map((x) => ({ value: `${x}`, label: `${x}/page` }))}
          onChange={(value) => setChapterListPageSize(parseInt(value || '', 10))}
        />
      </Group>
    </>
  );
};

export default ChapterTable;
