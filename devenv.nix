{ pkgs, lib, config, inputs, ... }:

{
  # https://devenv.sh/packages/
  packages = with pkgs; [
    nodejs_24
    nodePackages.prisma
  ];

  # https://devenv.sh/scripts/
  scripts.hello.exec = "echo hello from $GREET";

  enterShell = ''
    export PRISMA_SCHEMA_ENGINE_BINARY="${pkgs.prisma-engines}/bin/schema-engine"
    export PRISMA_QUERY_ENGINE_BINARY="${pkgs.prisma-engines}/bin/query-engine"
    export PRISMA_QUERY_ENGINE_LIBRARY="${pkgs.prisma-engines}/lib/libquery_engine.node"
    export PRISMA_INTROSPECTION_ENGINE_BINARY="${pkgs.prisma-engines}/bin/introspection-engine"
    export PRISMA_FMT_BINARY="${pkgs.prisma-engines}/bin/prisma-fmt"
  '';

  # https://devenv.sh/services/
  # services.postgres.enable = true;
  # services.postgres.package = pkgs.postgresql_16;
  # services.postgres.initialDatabases = [{ name = "unwhelm"; }];
  # services.postgres.listen_addresses = "127.0.0.1";

  # https://devenv.sh/languages/
  languages.javascript.enable = true;
  languages.typescript.enable = true;

  dotenv.enable = true;

  # https://devenv.sh/processes/
  # processes.dev.exec = "npm run dev";

  # https://devenv.sh/pre-commit-hooks/
  # pre-commit.hooks.shellcheck.enable = true;

  # See full reference at https://devenv.sh/reference/options/
}
