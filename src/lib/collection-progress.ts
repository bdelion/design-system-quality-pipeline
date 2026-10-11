/** Sortie minimale permettant de tester la progression sans terminal réel. */
export interface ProgressOutput {
  isTTY?: boolean | undefined;
  columns?: number | undefined;
  write(text: string): unknown;
}
/** Affiche la collecte sur stderr sans confondre quota GitHub et progression. */
export class CollectionProgress {
  private completed = 0;
  private issues = 0;
  private discovered = 0;
  private quota = '';
  private ended = false;
  /** Initialise une ligne interactive ou un message unique pour les journaux. */
  constructor(
    private readonly total: number,
    private readonly output: ProgressOutput = process.stderr
  ) {
    if (output.isTTY) this.render();
    else output.write('Collecte GitHub : démarrage (' + total + ' repositories).\n');
  }
  /** Ajoute les issues découvertes ; le total peut évoluer durant la pagination des repositories. */
  addIssues(count: number): void {
    if (this.ended) return;
    this.discovered += count;
    this.render();
  }
  /** Compte une issue après la collecte de toutes ses relations. */
  issueCompleted(): void {
    if (this.ended) return;
    this.issues++;
    this.render();
  }
  /** Compte un repository entièrement collecté. */
  repositoryCompleted(): void {
    if (this.ended) return;
    this.completed++;
    this.render();
  }
  /** Affiche les derniers faits du quota sans les utiliser comme taux d’avancement. */
  updateQuota(remaining: number, cost: number): void {
    if (this.ended) return;
    this.quota = ' | quota GraphQL ' + remaining + ' (coût ' + cost + ')';
    this.render();
  }
  /** Préserve un avertissement sur sa propre ligne puis restaure la progression interactive. */
  warn(message: string): void {
    if (this.output.isTTY && !this.ended) this.output.write('\r\x1b[2K');
    this.output.write(message + '\n');
    if (!this.ended) this.render();
  }
  /** Termine proprement la ligne, y compris en erreur ; les tâches tardives ne la réactivent pas. */
  finish(success: boolean): void {
    if (this.ended) return;
    this.ended = true;
    if (this.output.isTTY) this.output.write('\r\x1b[2K');
    this.output.write(
      'Collecte GitHub ' +
        (success ? 'terminée' : 'interrompue') +
        ' : ' +
        this.completed +
        '/' +
        this.total +
        ' repositories | ' +
        this.issues +
        '/' +
        this.discovered +
        ' issues découvertes traitées' +
        this.quota +
        '\n'
    );
  }
  /** Rafraîchit une ligne limitée à la largeur du terminal, sans journaliser chaque compteur. */
  private render(): void {
    if (!this.output.isTTY || this.ended) return;
    const fraction = this.total ? this.completed / this.total : 1;
    const filled = Math.round(fraction * 12);
    const text =
      'GitHub [' +
      '#'.repeat(filled) +
      '-'.repeat(12 - filled) +
      '] repos ' +
      this.completed +
      '/' +
      this.total +
      ' | issues ' +
      this.issues +
      '/' +
      this.discovered +
      ' découvertes' +
      this.quota;
    const width = Math.max(1, (this.output.columns ?? 120) - 1);
    this.output.write(
      '\r\x1b[2K' + (text.length > width ? text.slice(0, Math.max(0, width - 1)) + '…' : text)
    );
  }
}
