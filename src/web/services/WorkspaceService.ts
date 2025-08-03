import * as vscode from 'vscode';
import { FileUpdateError } from '../types';

export class WorkspaceService {
  public readDocument(document: vscode.TextDocument): string {
    return document.getText();
  }

  public async applyEdit(document: vscode.TextDocument, newContent: string): Promise<void> {
    const edit = new vscode.WorkspaceEdit();
    edit.replace(
      document.uri,
      new vscode.Range(0, 0, document.lineCount, 0),
      newContent
    );
    const success = await vscode.workspace.applyEdit(edit);
    if (!success) {
      throw new FileUpdateError('Failed to apply edit to the document.');
    }
  }
}
