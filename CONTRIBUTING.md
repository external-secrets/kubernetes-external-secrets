# Contributing to kubernetes-external-secrets

Thanks for taking the time to contribute!

## Contributing an Issue

We will try to respond to every issue. The issues that get the
quickest response are the ones that are easiest to respond to. The
issues that are easiest to respond to usually include the
following:

* For unexpected behavior or bugs, include sufficient details about
  your cluster and workload so that other contributors can try to
  reproduce the issue.
* For requests for help, explain what outcome you're trying to achieve
  (*e.g.*, "access secret data in AWS Secret Manager from a `Pod`")
  in addition to how you're trying to achieve it (*e.g.*, "I installed
  the Helm Chart on my cluster with these options and created an
  `ExternalSecret`").
* Relevant logs (*e.g.*, warnings and errors) from the external
  secrets controller.
* For feature requests, a description of the impact the feature will
  have on your project or cluster management experience. If possible,
  include a link to the open source repository for your project.

## Contributing a Pull Request

The most useful PRs provide the following:

1. Rationale for the PR. This can be a link to a supporting issue, or
   if it's a short PR a brief explanation in the PR.
1. Changes that pass all testing (*i.e.*, your PR will not break
   main). See the Development section in the
   [README.md](./README.md#development) for more details.
1. A small set of changes. It's OK to split up the full implementation
   of a large new feature over multiple PRs that each add a small bit
   of functionality.

## Maintainers

### Publishing a new release

Use `npm run release` to start the release process and follow the
instructions printed to the console.
