import type { ComponentType } from "react";

export interface AppRoute {
  path: string;
  title: string;
  breadcrumbs: string[];
  Component: ComponentType;
}
