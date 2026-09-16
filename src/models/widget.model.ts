export type WidgetWidth = "1/3" | "2/3" | "3/3";

export interface DashboardWidget {
  id: string;
  collectionId: string;
  width: WidgetWidth;
  limit: number;
  createdAt: number;
}
