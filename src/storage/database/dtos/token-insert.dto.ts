export class TokenInsertDTO {
  id: string;
  symbol: string;
  name: string;

  constructor(id: string, symbol: string, name: string) {
    this.id = id;
    this.symbol = symbol;
    this.name = name;
  }
}
