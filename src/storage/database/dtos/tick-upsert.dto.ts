export class TickUpsertDTO {
  id: string;
  tickIdx: number;
  price0: number;
  price1: number;

  constructor(id: string, tickIdx: number, price0: number, price1: number) {
    this.id = id;
    this.tickIdx = tickIdx;
    this.price0 = price0;
    this.price1 = price1;
  }
}
