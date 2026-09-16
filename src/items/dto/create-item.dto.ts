export class CreateItemDto {
  readonly name: string;
  readonly price: number;
  readonly description?: string;
}