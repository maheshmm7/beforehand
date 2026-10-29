import type { SVGProps } from 'react';

type IconProps = Omit<SVGProps<SVGSVGElement>, 'viewBox' | 'xmlns'> & { size?: number };

function Icon({ size = 20, children, ...rest }: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconRipple = (props: IconProps): React.JSX.Element => (
  <Icon {...props}>
    <circle cx="6" cy="12" r="2.4" fill="currentColor" stroke="none" />
    <path d="M10.5 8.6a5 5 0 0 1 0 6.8" />
    <path d="M14 6.2a9 9 0 0 1 0 11.6" />
    <path d="M17.5 3.8a13 13 0 0 1 0 16.4" opacity=".5" />
  </Icon>
);

export const IconCalendar = (props: IconProps): React.JSX.Element => (
  <Icon {...props}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
    <path d="M3.5 9.8h17M8.5 3v4M15.5 3v4" />
  </Icon>
);

export const IconReceipt = (props: IconProps): React.JSX.Element => (
  <Icon {...props}>
    <path d="M5.5 3.5h13v17l-2.2-1.6-2.1 1.6-2.2-1.6-2.1 1.6-2.2-1.6-2.2 1.6z" />
    <path d="M9 8.5h6M9 12.5h6" />
  </Icon>
);

export const IconSpark = (props: IconProps): React.JSX.Element => (
  <Icon {...props}>
    <path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9-1.9 5.1-1.9-5.1L5 10.5l5.1-1.9z" />
    <path d="M18.5 16.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
  </Icon>
);

export const IconShield = (props: IconProps): React.JSX.Element => (
  <Icon {...props}>
    <path d="M12 3l7 2.8v5.6c0 4.3-2.9 8.1-7 9.6-4.1-1.5-7-5.3-7-9.6V5.8z" />
    <path d="M9.2 12.1l2 2 3.6-3.9" />
  </Icon>
);

export const IconBranch = (props: IconProps): React.JSX.Element => (
  <Icon {...props}>
    <circle cx="7" cy="5.5" r="2.2" />
    <circle cx="7" cy="18.5" r="2.2" />
    <circle cx="17" cy="12" r="2.2" />
    <path d="M7 7.7v8.6M9.2 5.9c3.4.4 5.3 2.2 5.7 5.5M9.2 18.1c3.4-.4 5.3-2.2 5.7-5.5" />
  </Icon>
);

export const IconScale = (props: IconProps): React.JSX.Element => (
  <Icon {...props}>
    <path d="M12 4v16M7 20h10M4 9h16" />
    <path d="M4 9l-2.2 5a3.1 3.1 0 0 0 4.4 0z" />
    <path d="M20 9l2.2 5a3.1 3.1 0 0 1-4.4 0z" />
  </Icon>
);

export const IconLock = (props: IconProps): React.JSX.Element => (
  <Icon {...props}>
    <rect x="4.5" y="10" width="15" height="10.5" rx="2.6" />
    <path d="M8 10V7.8a4 4 0 0 1 8 0V10" />
  </Icon>
);

export const IconArrow = (props: IconProps): React.JSX.Element => (
  <Icon {...props}>
    <path d="M4.5 12h15M13.5 6l6 6-6 6" />
  </Icon>
);

export const IconCheck = (props: IconProps): React.JSX.Element => (
  <Icon {...props}>
    <path d="M4.5 12.5l5 5 10-11" />
  </Icon>
);

export const IconCross = (props: IconProps): React.JSX.Element => (
  <Icon {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

export const IconChevron = (props: IconProps): React.JSX.Element => (
  <Icon {...props}>
    <path d="M6 9.5l6 6 6-6" />
  </Icon>
);

export const IconSun = (props: IconProps): React.JSX.Element => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
  </Icon>
);

export const IconMoon = (props: IconProps): React.JSX.Element => (
  <Icon {...props}>
    <path d="M20 13.5A8.2 8.2 0 0 1 10.5 4a8.5 8.5 0 1 0 9.5 9.5z" />
  </Icon>
);

export const IconAuto = (props: IconProps): React.JSX.Element => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor" stroke="none" />
  </Icon>
);

export const IconMenu = (props: IconProps): React.JSX.Element => (
  <Icon {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
);
