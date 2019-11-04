# Contributing to kubernetes-external-secrets

Thanks for taking the time to contribute!

## Publishing a new release

If you're a maintainer use `npm run release` to start the release
process and follow the instructions printed to the console.

## Publishing a new chart release

If you're a maintainer use `./release-chart.sh <new-chart-version>` to start the release
process and follow the instructions printed to the console. The `<new-chart-version>` could be obtained
by bumping the chart version [here](https://github.com/godaddy/kubernetes-external-secrets/blob/master/charts/kubernetes-external-secrets/Chart.yaml#L3)
based on the changes.
