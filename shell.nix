{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
   nodejs-17_x
   miniserve
   nodePackages.yarn
   nodePackages.typescript-language-server
   nodePackages.vscode-html-languageserver-bin
   nodePackages.vscode-css-languageserver-bin
   nodePackages.vscode-json-languageserver
   nodePackages.svelte-language-server
   nodePackages.prettier
   nodePackages.eslint
  ];
}
