// Copyright (C) 2022-2025 Intel Corporation
// LIMITED EDGE SOFTWARE DISTRIBUTION LICENSE

import { ReactNode } from 'react';

export type MenuOption =
    | MenuOptionCommon
    | MenuOptionIcon
    | MenuOptionLinkText
    | MenuOptionTextAndIcon
    | MenuOptionSubsequentMenu;

export type MenuOptionTextAndIcon = MenuOptionLinkText & MenuOptionIcon;

type MenuOptionIcon = MenuOptionOnlyIcon | MenuOptionLink | MenuOptionPopover | MenuOptionAction;

interface MenuOptionCommon {
    id?: string;
    name: string;
    ariaLabel: string;
    isHidden?: boolean;
    url: string;
}

interface MenuOptionOnlyIcon extends MenuOptionCommon {
    icon: ReactNode;
}

interface MenuOptionLink extends MenuOptionOnlyIcon {
    url: string;
}
interface MenuOptionAction extends MenuOptionOnlyIcon {
    handler: () => void;
}

interface MenuOptionLinkText extends MenuOptionCommon {
    url: string;
}

interface MenuOptionPopover extends MenuOptionOnlyIcon {
    popover: ReactNode;
    messagesNumber?: number;
}

interface MenuOptionSubsequentMenu extends MenuOptionCommon {
    isSubsequentMenu: boolean;
}
