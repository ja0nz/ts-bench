{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
   nodePackages.yarn
   nodePackages.typescript-language-server
   nodePackages.vscode-html-languageserver-bin
   nodePackages.vscode-css-languageserver-bin
   nodePackages.prettier
   nodePackages.vscode-json-languageserver
  ];
}
