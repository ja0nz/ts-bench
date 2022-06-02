{ pkgs ? import <nixpkgs> {
  overlays = [
    (self: super: {
      yarn = super.yarn.override { nodejs = pkgs.nodejs-18_x; };
    })
  ];
} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
   nodejs-18_x
   yarn
   miniserve
   nodePackages.typescript-language-server
   nodePackages.vscode-html-languageserver-bin
   nodePackages.vscode-css-languageserver-bin
   nodePackages.vscode-json-languageserver
   nodePackages.svelte-language-server
   nodePackages.prettier
 ];
}
