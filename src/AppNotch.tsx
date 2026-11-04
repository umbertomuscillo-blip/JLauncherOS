import { type FC } from 'react';
import DynamicNotchOverlay from '@/components/notch/DynamicNotchOverlay';

const AppNotch: FC = () => {
  return (
    <div className="flex h-screen w-screen items-start justify-center overflow-hidden bg-transparent select-none">
      <DynamicNotchOverlay />
    </div>
  );
};

export default AppNotch;
