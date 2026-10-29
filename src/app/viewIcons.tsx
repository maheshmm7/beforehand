import type { View } from '@/lib/router';
import { IconCalendar, IconReceipt, IconScale, IconSpark } from '@/ui/icons';

export const VIEW_ICONS: Readonly<Record<View, React.JSX.Element>> = {
  budget: <IconScale size={19} />,
  timeline: <IconCalendar size={19} />,
  vendors: <IconReceipt size={19} />,
  ideas: <IconSpark size={19} />,
};
