const chart = {
  filename: "charts/kubernetes-external-secrets/Chart.yaml",
  updater: {
    readVersion(contents) {
      const [match] = contents.match(/appVersion: [a-zA-Z0-9\.]*/);
      return match.split(": ")[1];
    },

    writeVersion: (contents, version) =>
      contents
        .replace(/appVersion: [a-zA-Z0-9\.]*/, `appVersion: ${version}`)
        .replace(/version: [a-zA-Z0-9\.]*/, `version: ${version}`),
  },
};

const values = {
  filename: "charts/kubernetes-external-secrets/values.yaml",
  updater: {
    readVersion(contents) {
      const [match] = contents.match(/tag: [a-zA-Z0-9\.]*/);
      return match.split(": ")[1];
    },

    writeVersion: (contents, version) =>
      contents.replace(/tag: [a-zA-Z0-9\.]*/, `tag: ${version}`),
  },
};

const readme = {
  filename: "charts/kubernetes-external-secrets/README.md",
  updater: {
    readVersion(contents) {
      const [match] = contents.match(
        /kubernetes-external-secrets\sImage\stag\s+\|\s`([0-9]+.[0-9]+.[0-9]+)`/
      );
      return match.split("`")[1];
    },

    writeVersion: (contents, version) =>
      contents.replace(
        /(kubernetes-external-secrets\sImage\stag\s+\|\s)`([0-9]+.[0-9]+.[0-9]+)`/,
        `$1\`${version}\``
      ),
  },
};

module.exports = {
  scripts: {
    "prechangelog": "(cd charts/kubernetes-external-secrets && helm package . && helm repo index --merge ../../docs/index.yaml ./ && mv *.tgz ../../docs && mv index.yaml ../../docs && git add ../../docs)"
  },
  bumpFiles: [chart, values, readme],
};
