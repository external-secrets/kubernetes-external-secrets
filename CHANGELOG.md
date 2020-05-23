# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [3.3.0](https://github.com/godaddy/kubernetes-external-secrets/compare/3.2.0...3.3.0) (2020-05-01)


### Features

* add last_state metric ([#357](https://github.com/godaddy/kubernetes-external-secrets/issues/357)) ([1d9d237](https://github.com/godaddy/kubernetes-external-secrets/commit/1d9d237618cf6b027ef16d0d201a3b06723a1a6e))
* enable use of AWS STS regional endpoints ([#348](https://github.com/godaddy/kubernetes-external-secrets/issues/348)) ([9a46773](https://github.com/godaddy/kubernetes-external-secrets/commit/9a467737a88b186a2791595aed0a5712592026c3))
* improve out-of-the-box compatibility with clusters running locked down PodSecurityPolicy enabling runAsNonRoot by default ([#361](https://github.com/godaddy/kubernetes-external-secrets/issues/361)) ([27ba7e1](https://github.com/godaddy/kubernetes-external-secrets/commit/27ba7e1551c3a34091301dad6d31c8854397837d))
* support isBinary for GCP ([#353](https://github.com/godaddy/kubernetes-external-secrets/issues/353)) ([de20a1b](https://github.com/godaddy/kubernetes-external-secrets/commit/de20a1bf471562ac530e10239665961189026c33)), closes [#352](https://github.com/godaddy/kubernetes-external-secrets/issues/352)


### Bug Fixes

* **deps:** update dependency kubernetes-client to v9 ([#367](https://github.com/godaddy/kubernetes-external-secrets/issues/367)) ([f06bd59](https://github.com/godaddy/kubernetes-external-secrets/commit/f06bd595d3957c25d392ba70d90410eb17f5f4c8))
* **deps:** update dependency pino to v6 ([#322](https://github.com/godaddy/kubernetes-external-secrets/issues/322)) ([3664540](https://github.com/godaddy/kubernetes-external-secrets/commit/36645402c24b446ff232b8ec6930593c5131756c))
* **deps:** update dependency prom-client to v12 ([#323](https://github.com/godaddy/kubernetes-external-secrets/issues/323)) ([504ed6c](https://github.com/godaddy/kubernetes-external-secrets/commit/504ed6cfbbcdcbdd1b91cb6baf01e5cb6ceabc66))

## [3.2.0](https://github.com/godaddy/kubernetes-external-secrets/compare/3.1.0...3.2.0) (2020-03-27)


### Features

* add GCP support ([#312](https://github.com/godaddy/kubernetes-external-secrets/issues/312)) ([5b41ad0](https://github.com/godaddy/kubernetes-external-secrets/commit/5b41ad0e8af02d081d984ede77e67e8578581b92))


### Bug Fixes

* stringify json object based secrets ([#247](https://github.com/godaddy/kubernetes-external-secrets/issues/247)) ([828d0ce](https://github.com/godaddy/kubernetes-external-secrets/commit/828d0ced9ed1d8c65457be256b946272719e9067))
* upgrade aws-sdk from 2.575.0 to 2.628.0 ([#305](https://github.com/godaddy/kubernetes-external-secrets/issues/305)) ([149e33a](https://github.com/godaddy/kubernetes-external-secrets/commit/149e33afcc51801df4df1694a07e855efe0b12b8))
* upgrade pino from 5.13.6 to 5.16.0 ([#306](https://github.com/godaddy/kubernetes-external-secrets/issues/306)) ([be74814](https://github.com/godaddy/kubernetes-external-secrets/commit/be74814ef743632f6ba099cfbc7a7b7c451cc66e))
* verify dataFrom property in naming convention verification ([#292](https://github.com/godaddy/kubernetes-external-secrets/issues/292)) ([f26bf2b](https://github.com/godaddy/kubernetes-external-secrets/commit/f26bf2bb14cfc7f6827e53550c8474b89133bc45))
* **azure-registry:** handle binary files ([#311](https://github.com/godaddy/kubernetes-external-secrets/issues/311)) ([9727d48](https://github.com/godaddy/kubernetes-external-secrets/commit/9727d48740b4056cfd4788a6344e0961c5c228c0))

## [3.1.0](https://github.com/godaddy/kubernetes-external-secrets/compare/2.1.0...3.1.0) (2020-02-06)


### Features

* add validation to CRD ([#208](https://github.com/godaddy/kubernetes-external-secrets/issues/208)) ([d2ebaeb](https://github.com/godaddy/kubernetes-external-secrets/commit/d2ebaeba6ea40d1167944923c835942d550d0e3d))
* allow disabling of interval polling ([#211](https://github.com/godaddy/kubernetes-external-secrets/issues/211)) ([9441216](https://github.com/godaddy/kubernetes-external-secrets/commit/944121605bc93661ad3934026383e738660085b4))
* **chart:** support mounting existing secrets as files ([#213](https://github.com/godaddy/kubernetes-external-secrets/issues/213)) ([ac9b9e2](https://github.com/godaddy/kubernetes-external-secrets/commit/ac9b9e2a1cc2d69fed87b725b4ccd25f7ad5df97))
* allow enforcing naming conventions for key names, limiting which keys can be fetched from backends ([#230](https://github.com/godaddy/kubernetes-external-secrets/issues/230)) ([c4fdea6](https://github.com/godaddy/kubernetes-external-secrets/commit/c4fdea666fc75eabdcdbf1a863902f295864b740)), closes [#178](https://github.com/godaddy/kubernetes-external-secrets/issues/178) [#178](https://github.com/godaddy/kubernetes-external-secrets/issues/178) [#178](https://github.com/godaddy/kubernetes-external-secrets/issues/178)
* implement basic e2e tests ([#207](https://github.com/godaddy/kubernetes-external-secrets/issues/207)) ([dfa210b](https://github.com/godaddy/kubernetes-external-secrets/commit/dfa210b955bd5d67790f6f99a08d812574e5ecd9))
* **release:** use same version for app and chart release ([#242](https://github.com/godaddy/kubernetes-external-secrets/issues/242)) ([2000864](https://github.com/godaddy/kubernetes-external-secrets/commit/20008648857296b5a91e67c9e0197712a3a2eb19))
* **secrets-manager:** Added support for secrets versioning in Secrets Manager using version stage labels ([#181](https://github.com/godaddy/kubernetes-external-secrets/issues/181)) ([9d6c2f9](https://github.com/godaddy/kubernetes-external-secrets/commit/9d6c2f9aefedc0a8b9f6db9f0a43592e6280e93d))


### Bug Fixes

* add dataFrom support to vault backend (refactor kv-backend) ([#206](https://github.com/godaddy/kubernetes-external-secrets/issues/206)) ([24421b9](https://github.com/godaddy/kubernetes-external-secrets/commit/24421b925e52a3930097a14b8727bb54560d2632))
* bump pino and sub dependency flatstr, fixes [#218](https://github.com/godaddy/kubernetes-external-secrets/issues/218) ([#219](https://github.com/godaddy/kubernetes-external-secrets/issues/219)) ([db3491b](https://github.com/godaddy/kubernetes-external-secrets/commit/db3491bea7ad67a592b8c0bea3956d79ef9cb561))
* **chart:** remove one of the duplicate securityContext ([#222](https://github.com/godaddy/kubernetes-external-secrets/issues/222)) ([2b54f34](https://github.com/godaddy/kubernetes-external-secrets/commit/2b54f34ce8b8c962657b8b7a7fb6da9aa82dba7e))
* **kv-backend:** Add empty keyOptions for dataFrom case. ([#221](https://github.com/godaddy/kubernetes-external-secrets/issues/221)) ([8e838ee](https://github.com/godaddy/kubernetes-external-secrets/commit/8e838eef04f654510aed957c914e128e2fdcd690))
* **script:** remove external-secrets.yml patching from release.sh ([#216](https://github.com/godaddy/kubernetes-external-secrets/issues/216)) ([9d871cd](https://github.com/godaddy/kubernetes-external-secrets/commit/9d871cda830d39ed37c95f425a26ff92821bb30d))
* default service account annotation value ([#252](https://github.com/godaddy/kubernetes-external-secrets/issues/252)) ([b163a69](https://github.com/godaddy/kubernetes-external-secrets/commit/b163a6908d1de0ca956acbbdbd38de798bbcf784))
* do not skew binary data ([#244](https://github.com/godaddy/kubernetes-external-secrets/issues/244)) ([01e0ca2](https://github.com/godaddy/kubernetes-external-secrets/commit/01e0ca21556a7281c9affb0b2d48e1a413e04b12))
* remove required top level key from vault backend validation ([#255](https://github.com/godaddy/kubernetes-external-secrets/issues/255)) ([e567117](https://github.com/godaddy/kubernetes-external-secrets/commit/e5671179934d1cb97ff31772ba0b804047448161))
* status update conflicts should not cause crash, fixes [#199](https://github.com/godaddy/kubernetes-external-secrets/issues/199) ([#215](https://github.com/godaddy/kubernetes-external-secrets/issues/215)) ([e6171c8](https://github.com/godaddy/kubernetes-external-secrets/commit/e6171c89fab703c14341e015cabc10a2cf6c66f4))
* Stringify JSON response for compatibility with KV backend ([#214](https://github.com/godaddy/kubernetes-external-secrets/issues/214)) ([5527530](https://github.com/godaddy/kubernetes-external-secrets/commit/552753062e7b6357bd4bf918d3181fab79d59795))

## [3.0.0](https://github.com/godaddy/kubernetes-external-secrets/compare/2.2.1...3.0.0) (2020-01-09)


### Bug Fixes

* default service account annotation value ([#252](https://github.com/godaddy/kubernetes-external-secrets/issues/252)) ([b163a69](https://github.com/godaddy/kubernetes-external-secrets/commit/b163a69))
* remove required top level key from vault backend validation ([#255](https://github.com/godaddy/kubernetes-external-secrets/issues/255)) ([e567117](https://github.com/godaddy/kubernetes-external-secrets/commit/e567117))


### Features

* allow enforcing naming conventions for key names, limiting which keys can be fetched from backends ([#230](https://github.com/godaddy/kubernetes-external-secrets/issues/230)) ([c4fdea6](https://github.com/godaddy/kubernetes-external-secrets/commit/c4fdea6)), closes [#178](https://github.com/godaddy/kubernetes-external-secrets/issues/178) [#178](https://github.com/godaddy/kubernetes-external-secrets/issues/178) [#178](https://github.com/godaddy/kubernetes-external-secrets/issues/178)
* **release:** use same version for app and chart release ([#242](https://github.com/godaddy/kubernetes-external-secrets/issues/242)) ([2000864](https://github.com/godaddy/kubernetes-external-secrets/commit/2000864))

### [2.2.1](https://github.com/godaddy/kubernetes-external-secrets/compare/2.2.0...2.2.1) (2019-12-06)


### Bug Fixes

* bump pino and sub dependency flatstr, fixes [#218](https://github.com/godaddy/kubernetes-external-secrets/issues/218) ([#219](https://github.com/godaddy/kubernetes-external-secrets/issues/219)) ([db3491b](https://github.com/godaddy/kubernetes-external-secrets/commit/db3491b))
* **chart:** remove one of the duplicate securityContext ([#222](https://github.com/godaddy/kubernetes-external-secrets/issues/222)) ([2b54f34](https://github.com/godaddy/kubernetes-external-secrets/commit/2b54f34))
* **kv-backend:** Add empty keyOptions for dataFrom case. ([#221](https://github.com/godaddy/kubernetes-external-secrets/issues/221)) ([8e838ee](https://github.com/godaddy/kubernetes-external-secrets/commit/8e838ee))
* do not skew binary data ([#244](https://github.com/godaddy/kubernetes-external-secrets/issues/244)) ([01e0ca2](https://github.com/godaddy/kubernetes-external-secrets/commit/01e0ca2))

## [2.2.0](https://github.com/godaddy/kubernetes-external-secrets/compare/2.1.0...2.2.0) (2019-11-14)


### Bug Fixes

* add dataFrom support to vault backend (refactor kv-backend) ([#206](https://github.com/godaddy/kubernetes-external-secrets/issues/206)) ([24421b9](https://github.com/godaddy/kubernetes-external-secrets/commit/24421b9))
* status update conflicts should not cause crash, fixes [#199](https://github.com/godaddy/kubernetes-external-secrets/issues/199) ([#215](https://github.com/godaddy/kubernetes-external-secrets/issues/215)) ([e6171c8](https://github.com/godaddy/kubernetes-external-secrets/commit/e6171c8))
* Stringify JSON response for compatibility with KV backend ([#214](https://github.com/godaddy/kubernetes-external-secrets/issues/214)) ([5527530](https://github.com/godaddy/kubernetes-external-secrets/commit/5527530))
* **script:** remove external-secrets.yml patching from release.sh ([#216](https://github.com/godaddy/kubernetes-external-secrets/issues/216)) ([9d871cd](https://github.com/godaddy/kubernetes-external-secrets/commit/9d871cd))


### Features

* add validation to CRD ([#208](https://github.com/godaddy/kubernetes-external-secrets/issues/208)) ([d2ebaeb](https://github.com/godaddy/kubernetes-external-secrets/commit/d2ebaeb))
* allow disabling of interval polling ([#211](https://github.com/godaddy/kubernetes-external-secrets/issues/211)) ([9441216](https://github.com/godaddy/kubernetes-external-secrets/commit/9441216))
* **chart:** support mounting existing secrets as files ([#213](https://github.com/godaddy/kubernetes-external-secrets/issues/213)) ([ac9b9e2](https://github.com/godaddy/kubernetes-external-secrets/commit/ac9b9e2))
* **secrets-manager:** Added support for secrets versioning in Secrets Manager using version stage labels ([#181](https://github.com/godaddy/kubernetes-external-secrets/issues/181)) ([9d6c2f9](https://github.com/godaddy/kubernetes-external-secrets/commit/9d6c2f9))
* implement basic e2e tests ([#207](https://github.com/godaddy/kubernetes-external-secrets/issues/207)) ([dfa210b](https://github.com/godaddy/kubernetes-external-secrets/commit/dfa210b))

## [2.1.0](https://github.com/godaddy/kubernetes-external-secrets/compare/1.5.0...2.1.0) (2019-11-08)


### Bug Fixes

* **script:** fix release scripts ([#186](https://github.com/godaddy/kubernetes-external-secrets/issues/186)) ([238ebd6](https://github.com/godaddy/kubernetes-external-secrets/commit/238ebd6))
* add missing rbac rules to external-secrets.yml ([#195](https://github.com/godaddy/kubernetes-external-secrets/issues/195)) ([b6d8229](https://github.com/godaddy/kubernetes-external-secrets/commit/b6d8229))
* RBAC config to access namespaces ([#177](https://github.com/godaddy/kubernetes-external-secrets/issues/177)) ([9605756](https://github.com/godaddy/kubernetes-external-secrets/commit/9605756))


### Features

* add option to assume role ([#144](https://github.com/godaddy/kubernetes-external-secrets/issues/144)) ([f0ce6ed](https://github.com/godaddy/kubernetes-external-secrets/commit/f0ce6ed))
* add status subresource with last sync and generation tracking ([#133](https://github.com/godaddy/kubernetes-external-secrets/issues/133)) ([8db1749](https://github.com/godaddy/kubernetes-external-secrets/commit/8db1749))
* add support for dataFrom & fix: encoding of non-string values ([#196](https://github.com/godaddy/kubernetes-external-secrets/issues/196)) ([90f01c5](https://github.com/godaddy/kubernetes-external-secrets/commit/90f01c5))
* allow setting additional markup on generated secret resource using template ([#192](https://github.com/godaddy/kubernetes-external-secrets/issues/192)) ([25e2f74](https://github.com/godaddy/kubernetes-external-secrets/commit/25e2f74))
* make role-scope annotation configurable &  fix: allow missing roleArn even if annotations are set  ([#179](https://github.com/godaddy/kubernetes-external-secrets/issues/179)) ([8c17819](https://github.com/godaddy/kubernetes-external-secrets/commit/8c17819)), closes [#174](https://github.com/godaddy/kubernetes-external-secrets/issues/174) [#174](https://github.com/godaddy/kubernetes-external-secrets/issues/174)
* support Secret Binary from AWS Secrets Manager ([#197](https://github.com/godaddy/kubernetes-external-secrets/issues/197)) ([731edb1](https://github.com/godaddy/kubernetes-external-secrets/commit/731edb1))
* Update aws-sdk to enable IRSA (AWS IAM Roles for ServiceAccounts) support, add securityContext to helm chart  ([#200](https://github.com/godaddy/kubernetes-external-secrets/issues/200)) ([165662c](https://github.com/godaddy/kubernetes-external-secrets/commit/165662c))
* use spec in external secret resource, keeping secretDescriptor for backwards compat ([#204](https://github.com/godaddy/kubernetes-external-secrets/issues/204)) ([a2a9dff](https://github.com/godaddy/kubernetes-external-secrets/commit/a2a9dff))
* **vault:** Support for Hashicorp Vault ([#198](https://github.com/godaddy/kubernetes-external-secrets/issues/198)) ([d61312c](https://github.com/godaddy/kubernetes-external-secrets/commit/d61312c))

## [2.0.0](https://github.com/godaddy/kubernetes-external-secrets/compare/1.6.0...2.0.0) (2019-11-05)


### Bug Fixes

* **script:** fix release scripts ([#186](https://github.com/godaddy/kubernetes-external-secrets/issues/186)) ([238ebd6](https://github.com/godaddy/kubernetes-external-secrets/commit/238ebd6))
* add missing rbac rules to external-secrets.yml ([#195](https://github.com/godaddy/kubernetes-external-secrets/issues/195)) ([b6d8229](https://github.com/godaddy/kubernetes-external-secrets/commit/b6d8229))
* RBAC config to access namespaces ([#177](https://github.com/godaddy/kubernetes-external-secrets/issues/177)) ([9605756](https://github.com/godaddy/kubernetes-external-secrets/commit/9605756))


### Features

* add status subresource with last sync and generation tracking ([#133](https://github.com/godaddy/kubernetes-external-secrets/issues/133)) ([8db1749](https://github.com/godaddy/kubernetes-external-secrets/commit/8db1749))

## [1.6.0](https://github.com/godaddy/kubernetes-external-secrets/compare/1.5.0...1.6.0) (2019-10-23)


### Features

* add option to assume role ([#144](https://github.com/godaddy/kubernetes-external-secrets/issues/144)) ([f0ce6ed](https://github.com/godaddy/kubernetes-external-secrets/commit/f0ce6ed))

## [1.5.0](https://github.com/godaddy/kubernetes-external-secrets/compare/1.4.0...1.5.0) (2019-09-27)


### Features

* basic metrics ([#147](https://github.com/godaddy/kubernetes-external-secrets/issues/147)) ([ded6d31](https://github.com/godaddy/kubernetes-external-secrets/commit/ded6d31))

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
