import { titlebarTextState } from '@/renderer/state/libraryStates';
import { useRecoilValue } from 'recoil';
import packageJson from '../../../../package.json';
const { ipcRenderer } = require('electron');
import ipcChannels from '@/common/constants/ipcChannels.json';
import styles from './Titlebar.module.css';
import { Box } from '@mantine/core';
import { IconMinus, IconSquare, IconX } from '@tabler/icons';
import { themeState } from '@/renderer/state/settingStates';
import { themeProps } from '@/renderer/util/themes';

const Titlebar: React.FC = () => {
  const theme = useRecoilValue(themeState);
  const text = useRecoilValue(titlebarTextState);

  const formattedText = text ? `${packageJson.productName} - ${text}` : packageJson.productName;

  return (
    <Box {...themeProps(theme)} className={styles.container}>
      <Box className={styles.title}>
        <span>{formattedText}</span>
      </Box>
      <div className={styles.controls}>
        <Box
          className={styles.button}
          onClick={() => ipcRenderer.invoke(ipcChannels.WINDOW.MINIMIZE)}
        >
          <IconMinus width={14} height={14} />
        </Box>
        <Box
          className={styles.button}
          onClick={() => ipcRenderer.invoke(ipcChannels.WINDOW.MAX_RESTORE)}
        >
          <IconSquare width={14} height={14} />
        </Box>
        <Box
          className={`${styles.button} ${styles.exit}`}
          onClick={() => ipcRenderer.invoke(ipcChannels.WINDOW.CLOSE)}
        >
          <IconX width={16} height={16} />
        </Box>
      </div>
    </Box>
  );
};
export default Titlebar;
