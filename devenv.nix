{ pkgs, ... }:

{
  # https://devenv.sh/packages/
  packages = with pkgs;
    [
      nodejs
      yarn
      dprint
      graphviz
      nodePackages.ts-node
    ];

  # https://devenv.sh/scripts/
  scripts = with pkgs; {
    run-format.exec = "${dprint}/bin/dprint fmt";
    run-repl.exec = "${nodePackages.ts-node}/bin/ts-node";
    run-clean.exec = "rm -rf dist";
    # @remarks Needs chromium installed
    # @param {string} to src file
    run-deps.exec = ''
      if [ -z $1 ]; then echo "req path parameter"; exit 1; fi
      tfile=$(mktemp --suffix=.html)
      ${nodejs}/bin/npx depcruise $1 \
        -X "node_modules" --highlight "publish" \
        -T dot --prefix $PWD \
      | ${graphviz}/bin/dot -T svg \
      | ${nodejs}/bin/npx depcruise-wrap-stream-in-html > $tfile
      chromium $tfile 2>/dev/null
    '';
    # @param {string} name of new package
    run-template.exec = ''
      if [ -z $1 ]; then echo "req package name"; exit 1; fi
      cp -r @blueprint@ $1;
      sed -i "s/--placeholder--/$1/g" $(find $1 -type f)
    '';
  };

  # https://devenv.sh/languages/
  languages.typescript.enable = true;

  # https://devenv.sh/pre-commit-hooks/
  pre-commit.hooks.dprint = {
    enable = true;
    description = "check if formatted";
    entry = "true && ${pkgs.dprint}/bin/dprint check";
  };
}
