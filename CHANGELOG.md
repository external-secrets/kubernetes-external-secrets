# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.2.1](https://github.com/godaddy/kubernetes-external-secrets/compare/1.2.0...1.2.1) (2019-05-20)


### Bug Fixes

* **config:** remove default aws region ([#54](https://github.com/godaddy/kubernetes-external-secrets/issues/54)) ([4584a09](https://github.com/godaddy/kubernetes-external-secrets/commit/4584a09))
* **package:** update kubernetes-client to version 7.0.0 ([#49](https://github.com/godaddy/kubernetes-external-secrets/issues/49)) ([eeb7acf](https://github.com/godaddy/kubernetes-external-secrets/commit/eeb7acf))



# [1.2.0](https://github.com/godaddy/kubernetes-external-secrets/compare/1.1.0...1.2.0) (2019-04-09)


### Bug Fixes

* **package:** update make-promises-safe to version 5.0.0 ([#33](https://github.com/godaddy/kubernetes-external-secrets/issues/33)) ([a25b1d2](https://github.com/godaddy/kubernetes-external-secrets/commit/a25b1d2))


### Features

* **data:** support `.data` in the `secretDescriptor` ([#40](https://github.com/godaddy/kubernetes-external-secrets/issues/40)) ([4887469](https://github.com/godaddy/kubernetes-external-secrets/commit/4887469))



# 1.1.0 (2019-03-14)


### Bug Fixes

* **backends:** fix secretsManager backend name ([#27](https://github.com/godaddy/kubernetes-external-secrets/issues/27)) ([d494edf](https://github.com/godaddy/kubernetes-external-secrets/commit/d494edf))
* **deploy:** fix deployment file ([#4](https://github.com/godaddy/kubernetes-external-secrets/issues/4)) ([bcb1ad1](https://github.com/godaddy/kubernetes-external-secrets/commit/bcb1ad1))
* **dockerfile:** remove broken commands ([#3](https://github.com/godaddy/kubernetes-external-secrets/issues/3)) ([7901f90](https://github.com/godaddy/kubernetes-external-secrets/commit/7901f90))
* **rbac:** adjust the poller upsert code so it doesn't need `get` ([#22](https://github.com/godaddy/kubernetes-external-secrets/issues/22)) ([5cffe97](https://github.com/godaddy/kubernetes-external-secrets/commit/5cffe97))
* **typo:** fix typo in external secrets name ([#8](https://github.com/godaddy/kubernetes-external-secrets/issues/8)) ([e26f75c](https://github.com/godaddy/kubernetes-external-secrets/commit/e26f75c))
* **updating:** use PUT not PATCH when updating an existing Secret ([#20](https://github.com/godaddy/kubernetes-external-secrets/issues/20)) ([856d8e0](https://github.com/godaddy/kubernetes-external-secrets/commit/856d8e0))


### Features

* **cicd:** add .travis.yml file ([#9](https://github.com/godaddy/kubernetes-external-secrets/issues/9)) ([fbe52b3](https://github.com/godaddy/kubernetes-external-secrets/commit/fbe52b3))
* **deploy:** move deploy resources into single file ([#5](https://github.com/godaddy/kubernetes-external-secrets/issues/5)) ([a264f2c](https://github.com/godaddy/kubernetes-external-secrets/commit/a264f2c))
* **examples:** add hello-service example ([#6](https://github.com/godaddy/kubernetes-external-secrets/issues/6)) ([af5b1d2](https://github.com/godaddy/kubernetes-external-secrets/commit/af5b1d2))
* **json:** support JSON objects in AWS Secret Manager ([#13](https://github.com/godaddy/kubernetes-external-secrets/issues/13)) ([cd7130f](https://github.com/godaddy/kubernetes-external-secrets/commit/cd7130f))
* **project:** add nodemon for development ([#7](https://github.com/godaddy/kubernetes-external-secrets/issues/7)) ([ec25cbd](https://github.com/godaddy/kubernetes-external-secrets/commit/ec25cbd))
