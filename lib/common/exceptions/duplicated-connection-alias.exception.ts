export class DuplicatedConnectionAliasException {
  public readonly name = 'DuplicatedConnectionAlias';
  public readonly message: string;

  public constructor(alias: string) {
    this.message = `There already exists a connection with name ${alias}`;
  }
}
