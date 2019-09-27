# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.4.0](https://github.com/godaddy/kubernetes-external-secrets/compare/1.3.0...1.4.0) (2019-09-27)


### Bug Fixes

* **daemon:** Upsert secrets immediately poller added  ([a986dfb](https://github.com/godaddy/kubernetes-external-secrets/commit/a986dfb))
* **secret:** fix SSM parameter store code ([e5e635f](https://github.com/godaddy/kubernetes-external-secrets/commit/e5e635f))


### Features

* allow setting type in external secret to support other than Opaque secrets ([#130](https://github.com/godaddy/kubernetes-external-secrets/issues/130)) ([226697a](https://github.com/godaddy/kubernetes-external-secrets/commit/226697a))



### [1.3.1](https://github.com/godaddy/kubernetes-external-secrets/compare/1.3.0...1.3.1) (2019-07-18)


### Bug Fixes

* **secret:** fix SSM parameter store code ([e5e635f](https://github.com/godaddy/kubernetes-external-secrets/commit/e5e635f))



## [1.3.0](https://github.com/godaddy/kubernetes-external-secrets/compare/1.2.3...1.3.0) (2019-06-22)


### Bug Fixes

* remove logging of potentially secret value ([#96](https://github.com/godaddy/kubernetes-external-secrets/issues/96)) ([6063f79](https://github.com/godaddy/kubernetes-external-secrets/commit/6063f79))


### Features

* **secret:** add ownerreference to remove created secret when external secret is removed ([#95](https://github.com/godaddy/kubernetes-external-secrets/issues/95)) ([66af903](https://github.com/godaddy/kubernetes-external-secrets/commit/66af903))



### [1.2.3](https://github.com/godaddy/kubernetes-external-secrets/compare/1.2.2...1.2.3) (2019-06-06)


### Bug Fixes

* **logging:** show error on missing property ([#87](https://github.com/godaddy/kubernetes-external-secrets/issues/87)) ([ef8bd5f](https://github.com/godaddy/kubernetes-external-secrets/commit/ef8bd5f))



### [1.2.2](https://github.com/godaddy/kubernetes-external-secrets/compare/1.2.1...1.2.2) (2019-06-03)


### Bug Fixes

* **AWSSM:** treat value as object iff the es specifies .property ([#74](https://github.com/godaddy/kubernetes-external-secrets/issues/74)) ([1d5a9dd](https://github.com/godaddy/kubernetes-external-secrets/commit/1d5a9dd))



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
