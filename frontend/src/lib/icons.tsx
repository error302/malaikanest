'use client';

/**
 * lucide-react compatibility shim backed by Phosphor Icons.
 *
 * The storefront historically imported icons from `lucide-react`. To move to a
 * richer, more "real" icon set without editing ~70 files, `lucide-react` is
 * aliased to this module (see next.config.ts + tsconfig paths). Every icon name
 * used across the app is re-exported here, mapped to the closest Phosphor icon
 * and rendered with the `duotone` weight for a heavier, professional look.
 *
 * Phosphor icons accept: size, color, weight, className, style, mirrored.
 * They do NOT accept lucide's `strokeWidth`, so the wrapper strips it.
 */
import * as Ph from '@phosphor-icons/react';
import type { Icon as PhIcon } from '@phosphor-icons/react';
import React from 'react';

export interface IconProps {
  size?: number | string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  strokeWidth?: number | string;
  fill?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
  onClick?: React.MouseEventHandler<SVGSVGElement>;
}

const DEFAULT_WEIGHT: Ph.IconWeight = 'duotone';

/** Wrap a Phosphor icon so it accepts lucide-style props. */
function wrap(PhComponent: PhIcon, weight: Ph.IconWeight = DEFAULT_WEIGHT) {
  const Comp = React.forwardRef<SVGSVGElement, IconProps>(function IconShim(
    { strokeWidth: _ignored, fill, color, ...rest },
    ref,
  ) {
    return <PhComponent ref={ref} weight={weight} color={color ?? fill} {...rest} />;
  });
  Comp.displayName = `Icon(${PhComponent.displayName ?? 'Phosphor'})`;
  return Comp;
}

// ── Name map: lucide name -> Phosphor component ──────────────────────────────
// Some accents use a specific weight for visual balance.
export const Home = wrap(Ph.House);
export const ShoppingBag = wrap(Ph.Handbag);
export const ShoppingBasket = wrap(Ph.ShoppingCartSimple);
export const ShoppingCart = wrap(Ph.ShoppingCart);
export const Sparkles = wrap(Ph.Sparkle);
export const ArrowRight = wrap(Ph.ArrowRight, 'bold');
export const ArrowLeft = wrap(Ph.ArrowLeft, 'bold');
export const Mail = wrap(Ph.Envelope);
export const Check = wrap(Ph.Check, 'bold');
export const CheckCircle = wrap(Ph.CheckCircle);
export const Loader2 = wrap(Ph.CircleNotch, 'bold');
export const Shirt = wrap(Ph.TShirt);
export const Package = wrap(Ph.Package);
export const Gamepad2 = wrap(Ph.GameController);
export const Car = wrap(Ph.Car);
export const Gift = wrap(Ph.Gift);
export const ChevronRight = wrap(Ph.CaretRight, 'bold');
export const ChevronLeft = wrap(Ph.CaretLeft, 'bold');
export const ChevronDown = wrap(Ph.CaretDown, 'bold');
export const ArrowUp = wrap(Ph.ArrowUp, 'bold');
export const ArrowDown = wrap(Ph.ArrowDown, 'bold');
export const AlertCircle = wrap(Ph.WarningCircle);
export const Baby = wrap(Ph.Baby);
export const Heart = wrap(Ph.Heart);
export const User = wrap(Ph.User);
export const Users = wrap(Ph.Users);
export const Languages = wrap(Ph.Translate);
export const Facebook = wrap(Ph.FacebookLogo, 'fill');
export const Instagram = wrap(Ph.InstagramLogo, 'fill');
export const MessageCircle = wrap(Ph.WhatsappLogo, 'fill');
export const Phone = wrap(Ph.Phone, 'fill');
export const CreditCard = wrap(Ph.CreditCard);
export const MapPin = wrap(Ph.MapPin, 'fill');
export const X = wrap(Ph.X, 'bold');
export const Menu = wrap(Ph.List, 'bold');
export const Cookie = wrap(Ph.Cookie);
export const Star = wrap(Ph.Star, 'fill');
export const Quote = wrap(Ph.Quotes, 'fill');
export const Clock = wrap(Ph.Clock);
export const Tag = wrap(Ph.Tag, 'fill');
export const Pencil = wrap(Ph.PencilSimple);
export const PencilSimple = wrap(Ph.PencilSimple);
export const PencilLine = wrap(Ph.PencilLine);
export const Write = wrap(Ph.PencilLine);
export const Trash2 = wrap(Ph.Trash);
export const Plus = wrap(Ph.Plus, 'bold');
export const Minus = wrap(Ph.Minus, 'bold');
export const SlidersHorizontal = wrap(Ph.SlidersHorizontal);
export const Truck = wrap(Ph.Truck);
export const Shield = wrap(Ph.ShieldCheck);
export const Leaf = wrap(Ph.Leaf);
export const RefreshCw = wrap(Ph.ArrowsClockwise, 'bold');
export const RotateCcw = wrap(Ph.ArrowCounterClockwise, 'bold');
export const Settings = wrap(Ph.GearSix);
export const Award = wrap(Ph.Medal);
export const LogOut = wrap(Ph.SignOut);
export const Save = wrap(Ph.FloppyDisk);
export const Upload = wrap(Ph.UploadSimple, 'bold');
export const Download = wrap(Ph.DownloadSimple, 'bold');
export const Image = wrap(Ph.Image);
export const ImageIcon = Image;
export const Palette = wrap(Ph.Palette);
export const Globe = wrap(Ph.Globe);
export const Eye = wrap(Ph.Eye);
export const EyeOff = wrap(Ph.EyeSlash);
export const FileText = wrap(Ph.FileText);
export const Calendar = wrap(Ph.CalendarBlank);
export const Search = wrap(Ph.MagnifyingGlass, 'bold');
export const Lock = wrap(Ph.Lock, 'fill');
export const Folder = wrap(Ph.Folder, 'fill');
export const FolderTree = wrap(Ph.TreeStructure);
export const Type = wrap(Ph.TextT, 'bold');
export const Layers = wrap(Ph.StackSimple);
export const TrendingUp = wrap(Ph.TrendUp, 'bold');
export const DollarSign = wrap(Ph.CurrencyDollar, 'bold');
export const BarChart3 = wrap(Ph.ChartBar);
export const LayoutDashboard = wrap(Ph.SquaresFour);
export const Store = wrap(Ph.Storefront);
export const Smartphone = wrap(Ph.DeviceMobile);
export const Banknote = wrap(Ph.Money, 'fill');
export const Wallet = wrap(Ph.Wallet);
export const Share2 = wrap(Ph.ShareNetwork);
export const Navigation = wrap(Ph.NavigationArrow, 'fill');
export const Bus = wrap(Ph.Bus);
export const Camera = wrap(Ph.Camera);
export const Flame = wrap(Ph.Flame, 'fill');
export const XCircle = wrap(Ph.XCircle);
export const Edit2 = wrap(Ph.PencilSimpleLine);
export const MessageSquareQuote = wrap(Ph.ChatCircleText);

// ── Additional icons required by shadcn/ui v2 primitives ─────────────────────
// Newer shadcn/ui (Radix) components import lucide icons with an `Icon` suffix
// (e.g. `ChevronDownIcon`) and a handful of names that were not in the original
// map above. Add the missing Phosphor mappings + suffix aliases here so the
// `lucide-react` → `./src/lib/icons.tsx` alias keeps resolving without editing
// every `components/ui/*` file.
export const ChevronUp = wrap(Ph.CaretUp, 'bold');
export const Circle = wrap(Ph.Circle);
export const MoreHorizontal = wrap(Ph.DotsThree, 'bold');
export const GripVertical = wrap(Ph.DotsSixVertical, 'bold');
export const PanelLeft = wrap(Ph.SquareHalf);

// Suffix aliases (shadcn/ui naming convention)
export const ChevronDownIcon = ChevronDown;
export const ChevronLeftIcon = ChevronLeft;
export const ChevronRightIcon = ChevronRight;
export const ChevronUpIcon = ChevronUp;
export const CheckIcon = Check;
export const XIcon = X;
export const CircleIcon = Circle;
export const SearchIcon = Search;
export const MoreHorizontalIcon = MoreHorizontal;
export const MinusIcon = Minus;
export const GripVerticalIcon = GripVertical;
export const PanelLeftIcon = PanelLeft;
