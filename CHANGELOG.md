# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [8.5.4](https://github.com/external-secrets/kubernetes-external-secrets/compare/8.5.3...8.5.4) (2022-02-16)


### Bug Fixes

* **deps:** bump follow-redirects from 1.14.7 to 1.14.8 ([#907](https://github.com/external-secrets/kubernetes-external-secrets/issues/907)) ([a65b4f2](https://github.com/external-secrets/kubernetes-external-secrets/commit/a65b4f260abbdc1cdeb58b9ea165f48085905056))
* **deps:** CVE-2021-23555 bump vm2 from 3.9.5 to 3.9.7 ([#908](https://github.com/external-secrets/kubernetes-external-secrets/issues/908)) (see 2642fed) ([ce06c7b](https://github.com/external-secrets/kubernetes-external-secrets/commit/ce06c7bddf0792cb64cac95cad4714ed09309553))

### [8.5.3](https://github.com/external-secrets/kubernetes-external-secrets/compare/8.5.2...8.5.3) (2022-02-15)


### Bug Fixes

* **chart:** add deprecation notice ([264de92](https://github.com/external-secrets/kubernetes-external-secrets/commit/264de92e6b9ea905e3973b5b4d5fcc62b121a07d))

### [8.5.2](https://github.com/external-secrets/kubernetes-external-secrets/compare/8.5.1...8.5.2) (2022-01-31)


### Bug Fixes

* **azure:** AzureUSGovernment -> AzureUSGovernmentCloud ([#901](https://github.com/external-secrets/kubernetes-external-secrets/issues/901)) ([fa09c72](https://github.com/external-secrets/kubernetes-external-secrets/commit/fa09c7286ad3a16f6af85ac05df75ff3b18260a1))
* **azure:** bump @azure/identity and @azure/keyvault-secrets dependencies due to audit warnings ([d89bb84](https://github.com/external-secrets/kubernetes-external-secrets/commit/d89bb84d97a4fa49915e9dc2a96f9233100422e7))
* **deps:** CVE-2022-0155 bump follow-redirects from 1.14.4 to 1.14.7 ([#900](https://github.com/external-secrets/kubernetes-external-secrets/issues/900)) ([561faf2](https://github.com/external-secrets/kubernetes-external-secrets/commit/561faf27cd0051be9fdf234cd6b783d9941f7b13))
* **deps:** GHSA-64g7-mvw6-v9qj bump shelljs from 0.8.4 to 0.8.5 ([#899](https://github.com/external-secrets/kubernetes-external-secrets/issues/899)) ([4e3f068](https://github.com/external-secrets/kubernetes-external-secrets/commit/4e3f068dfb5e9e957817be72ad78d922f6eab991))
* **security:** npm audit fix, bump security alerted dependencies ([6fcbb56](https://github.com/external-secrets/kubernetes-external-secrets/commit/6fcbb565b3b7f6f5e21d56dc6fa3e0966981fb53))

### [8.5.1](https://github.com/external-secrets/kubernetes-external-secrets/compare/8.5.0...8.5.1) (2022-01-02)


### Bug Fixes

* **deps:** update json-schema CVE-2021-3918 ([#891](https://github.com/external-secrets/kubernetes-external-secrets/issues/891)) ([b06e66f](https://github.com/external-secrets/kubernetes-external-secrets/commit/b06e66f40614a32afc0163e35a4c83b8f65aedba))
* **dev-deps:** bump mocha ([#892](https://github.com/external-secrets/kubernetes-external-secrets/issues/892)) ([3994d3a](https://github.com/external-secrets/kubernetes-external-secrets/commit/3994d3a84ac518a727290c285a8e3a61509617dd))

## [8.5.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/8.4.0...8.5.0) (2021-12-17)


### Features

* add runtime metrics ([#877](https://github.com/external-secrets/kubernetes-external-secrets/issues/877)) ([8ff5aa0](https://github.com/external-secrets/kubernetes-external-secrets/commit/8ff5aa09155d36b2a27899e78e3f1c1b03fd15b1))
* **azure:** Support Azure sovereign cloud environments ([#871](https://github.com/external-secrets/kubernetes-external-secrets/issues/871)) ([148e5ce](https://github.com/external-secrets/kubernetes-external-secrets/commit/148e5ce8ca163092ea4271b1ff2c5998fe938683))

## [8.4.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/8.3.2...8.4.0) (2021-11-17)


### Features

* ✨ Introduce dataFromWithOptions ([#846](https://github.com/external-secrets/kubernetes-external-secrets/issues/846)) ([4dbb6dd](https://github.com/external-secrets/kubernetes-external-secrets/commit/4dbb6dd323629d5fef6de40bb4a722c6420a2f9d))
* **ibm:** add spec option keyByName to support the use of a name, instead of id, as the key ([#850](https://github.com/external-secrets/kubernetes-external-secrets/issues/850)) ([20496ab](https://github.com/external-secrets/kubernetes-external-secrets/commit/20496ab1969fb698700e9f4822e2055d43b2601e))
* Log base w/ configurable pid and hostname keys ([#868](https://github.com/external-secrets/kubernetes-external-secrets/issues/868)) ([ca549f5](https://github.com/external-secrets/kubernetes-external-secrets/commit/ca549f590184abfa1df49551479329a972a8b556))


### Bug Fixes

* redact sensitive information from logs ([#859](https://github.com/external-secrets/kubernetes-external-secrets/issues/859)) ([79da8cb](https://github.com/external-secrets/kubernetes-external-secrets/commit/79da8cb3c815c74f97c6ee776d520745fb9627ab))

### [8.3.2](https://github.com/external-secrets/kubernetes-external-secrets/compare/8.3.1...8.3.2) (2021-10-19)


### Bug Fixes

* update image to use alpine 3.14 base ([#855](https://github.com/external-secrets/kubernetes-external-secrets/issues/855)) ([99575ef](https://github.com/external-secrets/kubernetes-external-secrets/commit/99575ef8babbb6dc534e7a8ef08be9027a77868e))

### [8.3.1](https://github.com/external-secrets/kubernetes-external-secrets/compare/8.3.0...8.3.1) (2021-10-19)


### Bug Fixes

* fixes naming convention permission check for data items with path attribute only. ([#830](https://github.com/external-secrets/kubernetes-external-secrets/issues/830)) ([a7d8c6c](https://github.com/external-secrets/kubernetes-external-secrets/commit/a7d8c6c4bff197084c0f4f85cf6e1d801f7be562))
* package.json & package-lock.json to reduce vulnerabilities ([#825](https://github.com/external-secrets/kubernetes-external-secrets/issues/825)) ([946f692](https://github.com/external-secrets/kubernetes-external-secrets/commit/946f6927177b67cbbc7e8843b2dbb2b3ec2abf99))
* remove AWS_DEFAULT_REGION ([#794](https://github.com/external-secrets/kubernetes-external-secrets/issues/794)) ([45e8948](https://github.com/external-secrets/kubernetes-external-secrets/commit/45e894895c009f724f342e9860768f54d7e4552f))
* update runtime to node 14, update all transitive dependencies, update dev dependencies ([#854](https://github.com/external-secrets/kubernetes-external-secrets/issues/854)) ([7a178d0](https://github.com/external-secrets/kubernetes-external-secrets/commit/7a178d062fc5a01065fb81af55ec64775866fa9d))

## [8.3.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/8.2.3...8.3.0) (2021-08-05)


### Features

* **chart:** Add optional deployment labels value to charts ([#814](https://github.com/external-secrets/kubernetes-external-secrets/issues/814)) ([43eb046](https://github.com/external-secrets/kubernetes-external-secrets/commit/43eb04649ec3975e2f64cb6448aac2ee0b1f3b5c))


### Bug Fixes

* stop using deprecated/removed --generator flag in e2e tests ([#819](https://github.com/external-secrets/kubernetes-external-secrets/issues/819)) ([6347182](https://github.com/external-secrets/kubernetes-external-secrets/commit/63471824b9bf8a75704a92d07b57085ac00f0828))

### [8.2.3](https://github.com/external-secrets/kubernetes-external-secrets/compare/8.2.2...8.2.3) (2021-07-30)


### Bug Fixes

* **core:** verify data items with path attribute when using naming conventions. ([#800](https://github.com/external-secrets/kubernetes-external-secrets/issues/800)) ([129a518](https://github.com/external-secrets/kubernetes-external-secrets/commit/129a5188493d2520c03d4fe0af0ef35738432266))

### [8.2.2](https://github.com/external-secrets/kubernetes-external-secrets/compare/8.2.1...8.2.2) (2021-07-12)


### Bug Fixes

* **IBM:** correctly extract secret data for IBM IAM credentials type secrets ([#792](https://github.com/external-secrets/kubernetes-external-secrets/issues/792)) ([2f16714](https://github.com/external-secrets/kubernetes-external-secrets/commit/2f16714d13b22ff0eb450d0d0f0bf62bbd4ced25))

### [8.2.1](https://github.com/external-secrets/kubernetes-external-secrets/compare/8.2.0...8.2.1) (2021-07-02)


### Bug Fixes

* update transitive dependencies to resolve CVE-2020-28469, CVE-2021-33502 ([fcd353f](https://github.com/external-secrets/kubernetes-external-secrets/commit/fcd353f005c235594c9e849a464b8027a98da497))

## [8.2.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/8.1.3...8.2.0) (2021-07-02)


### Features

* **chart:** add securityContext settings for pod container ([#780](https://github.com/external-secrets/kubernetes-external-secrets/issues/780)) ([28ce1a8](https://github.com/external-secrets/kubernetes-external-secrets/commit/28ce1a86f0f6b7a0468eb7d55ee4b1876ab546fd))
* Upsert secrets only when needed ([#782](https://github.com/external-secrets/kubernetes-external-secrets/issues/782)) ([48db901](https://github.com/external-secrets/kubernetes-external-secrets/commit/48db9014fcd4c1be2324f856635bb7ccd0fe389c))

### [8.1.3](https://github.com/external-secrets/kubernetes-external-secrets/compare/8.1.2...8.1.3) (2021-06-14)


### Bug Fixes

* remove preserveUnknownFields ([#774](https://github.com/external-secrets/kubernetes-external-secrets/issues/774)) ([4957339](https://github.com/external-secrets/kubernetes-external-secrets/commit/4957339708a316888143fac8891440ee0d25ee0f))

### [8.1.2](https://github.com/external-secrets/kubernetes-external-secrets/compare/8.1.1...8.1.2) (2021-06-05)


### Bug Fixes

* **deps:** CVE-2021-32640, CVE-2021-23364, update transitive dependencies to address ReDOS vulnerabilities ([78f7b2e](https://github.com/external-secrets/kubernetes-external-secrets/commit/78f7b2e217c5fe240bbc4212f10d29a3a36ed716))

### [8.1.1](https://github.com/external-secrets/kubernetes-external-secrets/compare/8.1.0...8.1.1) (2021-06-03)


### Bug Fixes

* verify CRD is available on startup ([182e224](https://github.com/external-secrets/kubernetes-external-secrets/commit/182e2244ffbe24cee2ee160a65d89aa5839df72d))

## [8.1.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/8.0.2...8.1.0) (2021-06-03)


### Features

* Akeyless backend ([#767](https://github.com/external-secrets/kubernetes-external-secrets/issues/767)) ([dad820a](https://github.com/external-secrets/kubernetes-external-secrets/commit/dad820a22c730d78602a680fc4a22efcfd10d8bd))

### [8.0.2](https://github.com/external-secrets/kubernetes-external-secrets/compare/8.0.1...8.0.2) (2021-06-03)


### Bug Fixes

* **crd:** remove unnecessary empty properties in oneOf validation ([#758](https://github.com/external-secrets/kubernetes-external-secrets/issues/758)) ([fa54f54](https://github.com/external-secrets/kubernetes-external-secrets/commit/fa54f54dd6d684f3a7b87e212da2e09329338fe6)), closes [#753](https://github.com/external-secrets/kubernetes-external-secrets/issues/753)
* **watcher:** ensure that the restart timer is always started regardless of whether there are events or not ([#765](https://github.com/external-secrets/kubernetes-external-secrets/issues/765)) ([1de5432](https://github.com/external-secrets/kubernetes-external-secrets/commit/1de5432255425332a738db9308b7a137b5f41f73))

### [8.0.1](https://github.com/external-secrets/kubernetes-external-secrets/compare/8.0.0...8.0.1) (2021-05-13)


### Bug Fixes

* add observedGeneration to CRD status fields ([#747](https://github.com/external-secrets/kubernetes-external-secrets/issues/747)) ([d8abea3](https://github.com/external-secrets/kubernetes-external-secrets/commit/d8abea3f184d43cd2806a7b2b6ee32df6bfe9f27))

## [8.0.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/7.2.1...8.0.0) (2021-05-12)


### ⚠ BREAKING CHANGES

* Drops support for kubernetes versions <1.16. This _shouldn't_ be a breaking change if you have followed earlier deprecation's (like using `spec` instead of `secretDescriptor`. The updated CRD complies with the new structural validation and should validate all fields, any fields missing in the validation will be dropped from your ExternalSecret resource.

### Bug Fixes

* update crd to apiextensions.k8s.io/v1 ([#681](https://github.com/external-secrets/kubernetes-external-secrets/issues/681)) ([73aeaef](https://github.com/external-secrets/kubernetes-external-secrets/commit/73aeaef3f725ae2f3011ff24d9b7243716f639c9))

### [7.2.1](https://github.com/external-secrets/kubernetes-external-secrets/compare/7.2.0...7.2.1) (2021-04-26)


### Bug Fixes

* correctly pass instanceId to daemon so scoping with controllerId works ([#719](https://github.com/external-secrets/kubernetes-external-secrets/issues/719)) ([82f54e2](https://github.com/external-secrets/kubernetes-external-secrets/commit/82f54e20a8bc765b4d29568ec1f30200e5e3e6a2))
* update dependency jose ([#713](https://github.com/external-secrets/kubernetes-external-secrets/issues/713)) ([e47dee0](https://github.com/external-secrets/kubernetes-external-secrets/commit/e47dee0f17388c561c5cede43f283ccc0a8a0e5d))

## [7.2.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/7.1.0...7.2.0) (2021-04-14)


### Features

* **chart:** add envVarsFromConfigMap and envFrom support for more options to configure the Helm deployment ([#706](https://github.com/external-secrets/kubernetes-external-secrets/issues/706)) ([14900e5](https://github.com/external-secrets/kubernetes-external-secrets/commit/14900e532df9c71e741124225c0cdb34158ac1d8))


### Bug Fixes

* crash on watcher events introduced with multi-tenancy ([#708](https://github.com/external-secrets/kubernetes-external-secrets/issues/708)) ([c7250cc](https://github.com/external-secrets/kubernetes-external-secrets/commit/c7250cc6765668a5c6a56a0798e13dbc0f1eb3d3))

## [7.1.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/7.0.1...7.1.0) (2021-04-14)


### Features

* **multitenancy:** scope KES access using ExternalSecret `spec.controllerId` and `INSTANCE_ID` env ([#701](https://github.com/external-secrets/kubernetes-external-secrets/issues/701)) ([af50ca6](https://github.com/external-secrets/kubernetes-external-secrets/commit/af50ca63130e0b7d14fcc29dd1f65ef9092f25aa))

### [7.0.1](https://github.com/external-secrets/kubernetes-external-secrets/compare/7.0.0...7.0.1) (2021-04-08)


### Bug Fixes

* **chart:** add prerelease suffix ('>=1.17.0-0') to all semverCompare checks in rbac template ([#699](https://github.com/external-secrets/kubernetes-external-secrets/issues/699)) ([87d6037](https://github.com/external-secrets/kubernetes-external-secrets/commit/87d603710bbfadec785b6b12ef3d70b4019daee0))
* **chart:** bump Helm chart API version ([#698](https://github.com/external-secrets/kubernetes-external-secrets/issues/698)) ([ce27e88](https://github.com/external-secrets/kubernetes-external-secrets/commit/ce27e88c56756cc96950f9524f8d16bc63860579))

## [7.0.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/6.4.0...7.0.0) (2021-04-06)


### ⚠ BREAKING CHANGES

* require .spec field in CRD validation (#682)
* drop helm v2 and builtin CRD management (#663)
* rename time field to avoid duplicate time key in log output

### Features

* add arm v7 as docker multi arch target ([#679](https://github.com/external-secrets/kubernetes-external-secrets/issues/679)) ([7c7cca8](https://github.com/external-secrets/kubernetes-external-secrets/commit/7c7cca8521df628e3fb2c940c8c6b198000db540))
* add container scan ([#658](https://github.com/external-secrets/kubernetes-external-secrets/issues/658)) ([82ff43e](https://github.com/external-secrets/kubernetes-external-secrets/commit/82ff43e07a26e41a7938f3c51db42db5d5f75219))
* add support for IBM Cloud Secrets Manager backend ([#656](https://github.com/external-secrets/kubernetes-external-secrets/issues/656)) ([8ff9490](https://github.com/external-secrets/kubernetes-external-secrets/commit/8ff9490904a9fd6eea70562e7a5349a88cb866d4))
* automated docker image build with multi arch (amd64 + arm64) ([#665](https://github.com/external-secrets/kubernetes-external-secrets/issues/665)) ([4846313](https://github.com/external-secrets/kubernetes-external-secrets/commit/48463138ff7506e89da473a6165035a1e1f51d32))
* drop helm v2 and builtin CRD management ([#663](https://github.com/external-secrets/kubernetes-external-secrets/issues/663)) ([87a3ecb](https://github.com/external-secrets/kubernetes-external-secrets/commit/87a3ecb904f13f936a26296cdb8270521a432e98))


### Bug Fixes

* add a accurate log message when AWS region is not defined in the Systems manager manifest ([#648](https://github.com/external-secrets/kubernetes-external-secrets/issues/648)) ([448305a](https://github.com/external-secrets/kubernetes-external-secrets/commit/448305a8135eb3e8b697ed6df799eb431aef71e6))
* remove instructions to push docker image when cutting release ([472ad25](https://github.com/external-secrets/kubernetes-external-secrets/commit/472ad251cc1f4ffc46c462221ee2956316f9d186))
* rename time field to avoid duplicate time key in log output ([faf2093](https://github.com/external-secrets/kubernetes-external-secrets/commit/faf20933425f9f26f9c3c5ffbd5817a6f3aec5b0))
* require .spec field in CRD validation ([#682](https://github.com/external-secrets/kubernetes-external-secrets/issues/682)) ([e43a6b8](https://github.com/external-secrets/kubernetes-external-secrets/commit/e43a6b8cc91fb4eaeb474571798807a230f3767c))
* update transitive deps ([#667](https://github.com/external-secrets/kubernetes-external-secrets/issues/667)) ([7852dd6](https://github.com/external-secrets/kubernetes-external-secrets/commit/7852dd6dc89ddaef1dcf99ef108651f543ad704b))
* update transitive netmask dependency to resolve CVE-2021-28918 ([#693](https://github.com/external-secrets/kubernetes-external-secrets/issues/693)) ([483fb90](https://github.com/external-secrets/kubernetes-external-secrets/commit/483fb90401ce4cf3383d730f05b6f3c9e567bd5d))
* use getObjectStream to address deprecation warning in kubernetes-client ([#664](https://github.com/external-secrets/kubernetes-external-secrets/issues/664)) ([3ee939a](https://github.com/external-secrets/kubernetes-external-secrets/commit/3ee939a0882742440d6aeca863f398d054b36992))
* watch without namespace path if watching all namespaces ([#673](https://github.com/external-secrets/kubernetes-external-secrets/issues/673)) ([fa070ef](https://github.com/external-secrets/kubernetes-external-secrets/commit/fa070ef152dff5aa0a08812b4a42b08855e451b2))
* **deps:** drop individual 'lodash.*' packages in favor of lodash package  ([#661](https://github.com/external-secrets/kubernetes-external-secrets/issues/661)) ([cfe3366](https://github.com/external-secrets/kubernetes-external-secrets/commit/cfe3366e93738ce74e46431bbbef2127d507ef7a))
* **helm:** add patch version to semverCompare ([#637](https://github.com/external-secrets/kubernetes-external-secrets/issues/637)) ([9394316](https://github.com/external-secrets/kubernetes-external-secrets/commit/939431695d7e4fd1b2fe2422692773b7a076afd9))
* **secretsManager:** remove 'undefined' log message when AWS region is not defined in the ExternalSecret manifest ([#641](https://github.com/external-secrets/kubernetes-external-secrets/issues/641)) ([3409c66](https://github.com/external-secrets/kubernetes-external-secrets/commit/3409c66500e25ec2d069585e7d39e9699e790fe1))

## [6.4.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/6.3.0...6.4.0) (2021-02-25)


### Features

* **poller:** lodash template preprocess for externalsecret.spec.template field ([#626](https://github.com/external-secrets/kubernetes-external-secrets/issues/626)) ([6639553](https://github.com/external-secrets/kubernetes-external-secrets/commit/66395530b7c8070a222d41704e80947d5a9269f2))

## [6.3.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/6.2.0...6.3.0) (2021-02-10)


### Features

* **aws:** allow custom endpoints for aws services ([#602](https://github.com/external-secrets/kubernetes-external-secrets/issues/602)) ([03f5c65](https://github.com/external-secrets/kubernetes-external-secrets/commit/03f5c656a6d988dfb0edfc1109c3448aa3969d4a))
* **aws-ssm:** Add support to get parameters by path ([#603](https://github.com/external-secrets/kubernetes-external-secrets/issues/603)) ([74d4459](https://github.com/external-secrets/kubernetes-external-secrets/commit/74d445902e0c63f2ea82be50afc4b2b11dbe3a59))
* **core:** adds support for nested key lookups (eg `key: a.b.c` to get nested value in json secret) ([#592](https://github.com/external-secrets/kubernetes-external-secrets/issues/592)) ([190e6db](https://github.com/external-secrets/kubernetes-external-secrets/commit/190e6dbf583b74fee137a5ec5a4d58f016f37bc7))
* **helm:** add in ability to inject init containers in to deployment from values ([#615](https://github.com/external-secrets/kubernetes-external-secrets/issues/615)) ([21acce1](https://github.com/external-secrets/kubernetes-external-secrets/commit/21acce1891bb75e28e82a5163709d81395206224))
* **helm:** add pdb in helm chart ([#616](https://github.com/external-secrets/kubernetes-external-secrets/issues/616)) ([3be641f](https://github.com/external-secrets/kubernetes-external-secrets/commit/3be641fd3419f780c95f52c91aace4ba11530499))

## [6.2.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/6.1.0...6.2.0) (2021-01-21)


### Features

* **multitenancy:** Allow to watch ExternalSecrets in specific namespaces ([#548](https://github.com/external-secrets/kubernetes-external-secrets/issues/548)) ([85739fd](https://github.com/external-secrets/kubernetes-external-secrets/commit/85739fde531e64eb329cc4a28264ffc80e29a5f0))
* Add HTTP Proxy support to AWS SDK ([#601](https://github.com/external-secrets/kubernetes-external-secrets/issues/601)) ([c9d7785](https://github.com/external-secrets/kubernetes-external-secrets/commit/c9d77857add2b79f9e970b7fe20f45187439f159))

## [6.1.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/6.0.0...6.1.0) (2020-12-22)


### Features

* add general support for isBinary for all backends ([#585](https://github.com/external-secrets/kubernetes-external-secrets/issues/585)) ([e138a28](https://github.com/external-secrets/kubernetes-external-secrets/commit/e138a28973aeadb9902195ca889147a2705f43e4))
* restart watcher if no events seen for specified period (default 60 sec) ([#532](https://github.com/external-secrets/kubernetes-external-secrets/issues/532)) ([bb1ed9e](https://github.com/external-secrets/kubernetes-external-secrets/commit/bb1ed9eefde360d55f25cdd4767440f0f9f35cde))
* **helm:** add the ability to set the priorityClassName ([#534](https://github.com/external-secrets/kubernetes-external-secrets/issues/534)) ([e719c87](https://github.com/external-secrets/kubernetes-external-secrets/commit/e719c8724f4496d51f962b689b40ee49a0cd928a))
* **metrics:** add metrics names following Prometheus best practices, **deprecating** old metrics names! ([#540](https://github.com/external-secrets/kubernetes-external-secrets/issues/540)) ([5b5a00f](https://github.com/external-secrets/kubernetes-external-secrets/commit/5b5a00fdad1100abf057c2d944643469174d2048))


### Bug Fixes

* **values:** imagePullSecrets was wrongly indented under image ([#577](https://github.com/external-secrets/kubernetes-external-secrets/issues/577)) ([7861473](https://github.com/external-secrets/kubernetes-external-secrets/commit/78614739a7e8de9aab85ce5e063b5bde8f6c0a2b)), closes [#522](https://github.com/external-secrets/kubernetes-external-secrets/issues/522)
* configure nestedKey in logger to avoid invalid json ([#568](https://github.com/external-secrets/kubernetes-external-secrets/issues/568)) ([a430320](https://github.com/external-secrets/kubernetes-external-secrets/commit/a430320e8b9857154b4eca888fa5775ba3e1cda5))
* **deps:** bumping @grpc/grpc-js to 1.1.8 ([#550](https://github.com/external-secrets/kubernetes-external-secrets/issues/550)) ([4e88026](https://github.com/external-secrets/kubernetes-external-secrets/commit/4e88026fb21b73f2242226548abad80479d33a46))
* **deps:** bumping lodash from 4.17.19 to 4.17.20 ([#545](https://github.com/external-secrets/kubernetes-external-secrets/issues/545)) ([6c9d60d](https://github.com/external-secrets/kubernetes-external-secrets/commit/6c9d60d426405e16bce7ee00b542dde43b5e7171))

## [6.0.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/5.2.0...6.0.0) (2020-10-09)


### ⚠ BREAKING CHANGES

* **azure:** Unwraps the value returned from Azure Key vault (migration: "property: value" -> remove property selector) (#460)

### Features

* **aws:** add region support to ssm and sm ([#475](https://github.com/external-secrets/kubernetes-external-secrets/issues/475)) ([0b35441](https://github.com/external-secrets/kubernetes-external-secrets/commit/0b354413cc8f68b604b0507cee12cf4ff2ffb463))
* **aws:** add support for setting an intermediate iam role ([#454](https://github.com/external-secrets/kubernetes-external-secrets/issues/454)) ([72920e4](https://github.com/external-secrets/kubernetes-external-secrets/commit/72920e4d8b42b434199ad4ab5b500bed5ac464e1))
* Cluster level default settings for Hashicorp Vault ([#472](https://github.com/external-secrets/kubernetes-external-secrets/issues/472)) ([5215090](https://github.com/external-secrets/kubernetes-external-secrets/commit/5215090625c07ff0be296a11dec02715e186b551))


### Bug Fixes

* **azure:** Unwraps the value returned from Azure Key vault (migration: "property: value" -> remove property selector) ([#460](https://github.com/external-secrets/kubernetes-external-secrets/issues/460)) ([36d5bbb](https://github.com/external-secrets/kubernetes-external-secrets/commit/36d5bbb2f2046ca6e9dd79863f145b7cacc9bfba))
* **deps:** update dependency @google-cloud/secret-manager to v3 ([#345](https://github.com/external-secrets/kubernetes-external-secrets/issues/345)) ([2bf42db](https://github.com/external-secrets/kubernetes-external-secrets/commit/2bf42db6bdd04f04ed7c7d78db1c959eb1eb9d40))
* **helm:** apply namespace to Deployment and Service ([#471](https://github.com/external-secrets/kubernetes-external-secrets/issues/471)) ([ba38e3a](https://github.com/external-secrets/kubernetes-external-secrets/commit/ba38e3a19d439495bcecab65842b033290876c5d))
* **vault:** Cache Vault clients/tokens on a per-role&mountpoint basis. ([#488](https://github.com/external-secrets/kubernetes-external-secrets/issues/488)) ([ab36718](https://github.com/external-secrets/kubernetes-external-secrets/commit/ab36718cb1e0d66423da19abd09eae2808e94b9f))
* **vault:** handle token renewal failures ([#497](https://github.com/external-secrets/kubernetes-external-secrets/issues/497)) ([c3c27bc](https://github.com/external-secrets/kubernetes-external-secrets/commit/c3c27bc427c7129e4e98b5b10e4c5dde146c422d))
* e2e tests to work with kind 0.9.0 + bump k8s version used ([#498](https://github.com/external-secrets/kubernetes-external-secrets/issues/498)) ([f815afd](https://github.com/external-secrets/kubernetes-external-secrets/commit/f815afdf92403bce2a9b5dc2411e934275ec2efc))
* provide a meaningful error message when an SSM parameter is missing ([#483](https://github.com/external-secrets/kubernetes-external-secrets/issues/483)) ([99ce81e](https://github.com/external-secrets/kubernetes-external-secrets/commit/99ce81eb72f37d7f0b08a3b31fdeb2174eac8e0b))

## [5.2.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/5.1.0...5.2.0) (2020-08-18)


### Bug Fixes

* **vault:** token ttl conditional renew ([#457](https://github.com/external-secrets/kubernetes-external-secrets/issues/457)) ([a52987b](https://github.com/external-secrets/kubernetes-external-secrets/commit/a52987b7b4951dc7e6f50f92a8bd8a45aa6f8ef1))
* reverts assumeRole to use pod role instead of web identity ([#453](https://github.com/external-secrets/kubernetes-external-secrets/issues/453)) ([fa747dc](https://github.com/external-secrets/kubernetes-external-secrets/commit/fa747dcbcd09136793b9045cb4331efe28f8e163))

## [5.1.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/5.0.0...5.1.0) (2020-07-27)


### Features

* added the option to enforce namespace annotations ([#448](https://github.com/external-secrets/kubernetes-external-secrets/issues/448)) ([1517333](https://github.com/external-secrets/kubernetes-external-secrets/commit/1517333314359d5754864956bd49be83b9070120))


### Bug Fixes

* **config:** extract LOG_MESSAGE_KEY properly ([#456](https://github.com/external-secrets/kubernetes-external-secrets/issues/456)) ([a50c219](https://github.com/external-secrets/kubernetes-external-secrets/commit/a50c219c9f7c5f1455bb4c0808dd651b2e519fd5))
* **pino:** messageKey option as root constructor property ([#455](https://github.com/external-secrets/kubernetes-external-secrets/issues/455)) ([22208b0](https://github.com/external-secrets/kubernetes-external-secrets/commit/22208b05023fa90eb7a8dd944e444358edb69a14))

## [5.0.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/4.2.0...5.0.0) (2020-07-24)

**NOTE** There was no breaking changes in this release, just a release script mishap bumping the major.


### Features

* **chart::** add dns config options
* **logging:** add config to allow switching level format to human-readable log levels ([#429](https://github.com/external-secrets/kubernetes-external-secrets/issues/429)) ([4602ad0](https://github.com/external-secrets/kubernetes-external-secrets/commit/4602ad0616b9e5e0ec3e90ea4de8383d9482f4d8))
* **secretsManager:** add support for versionId in AWS Secrets Manager ([#436](https://github.com/external-secrets/kubernetes-external-secrets/issues/436)) ([95827bc](https://github.com/external-secrets/kubernetes-external-secrets/commit/95827bcbeeb6ae87bee274022fac80c6c4754a79))


### Bug Fixes

* upgrade the Azure Identity SDK and Azure KeyVault secret SDK to support AKS pod identity for authorization ([#447](https://github.com/external-secrets/kubernetes-external-secrets/issues/447)) ([020c10b](https://github.com/external-secrets/kubernetes-external-secrets/commit/020c10b75f2fd749bc2f010ff8090f958a081854))

## [4.2.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/4.1.0...4.2.0) (2020-07-12)


### Features

* add support for using either Vault k/v 1 or k/v 2 ([#426](https://github.com/external-secrets/kubernetes-external-secrets/issues/426)) ([4193050](https://github.com/external-secrets/kubernetes-external-secrets/commit/4193050156de8ea3daaab712438f94d2bae395fc))

## [4.1.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/4.0.0...4.1.0) (2020-07-09)


### Features

* add e2e test for naming conventions enforcement ([#412](https://github.com/external-secrets/kubernetes-external-secrets/issues/412)) ([bfb5ed2](https://github.com/external-secrets/kubernetes-external-secrets/commit/bfb5ed2203edb3c08be4936342aa03b2bcf77a37))
* allow permitted-key-name to be provided as list ([#409](https://github.com/external-secrets/kubernetes-external-secrets/issues/409)) ([10e3991](https://github.com/external-secrets/kubernetes-external-secrets/commit/10e3991fff8d950ee5ac9d2d288257be401bfd96))
* Vault namespace support ([#403](https://github.com/external-secrets/kubernetes-external-secrets/issues/403)) ([6bd9570](https://github.com/external-secrets/kubernetes-external-secrets/commit/6bd95706e77d2813ed226dafbfe8756b1d5cae14))


### Bug Fixes

* pass in the Web Identity token to assumeRoleWithWebIdentity ([#417](https://github.com/external-secrets/kubernetes-external-secrets/issues/417)) ([23d511f](https://github.com/external-secrets/kubernetes-external-secrets/commit/23d511f02901e0f1222b6d89122cc930cffa7939))
* use assumeRoleWithWebIdentity when using IRSA ([#416](https://github.com/external-secrets/kubernetes-external-secrets/issues/416)) ([117b926](https://github.com/external-secrets/kubernetes-external-secrets/commit/117b9268759964e07bf412ba53a54e18ef53d1d8))
* **vault:** fix requestOptions for vault namespace support ([#410](https://github.com/external-secrets/kubernetes-external-secrets/issues/410)) ([e80d83d](https://github.com/external-secrets/kubernetes-external-secrets/commit/e80d83d5c763b8eee312d6bac3a836e12ccb9194))

## [4.0.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/3.3.0...4.0.0) (2020-06-02)


### ⚠ BREAKING CHANGES

* Changes the values return type from GCP secret manager
Previously secret value was wrapped in an object `{ "value": <secret> }` while now `<secret>` will be returned directly so KES features can be properly used
* `GOOGLE_APPLICATION_CREDENTIALS: /app/gcp-creds/gcp-creds.json` is no longer set by default as it causes conflicts with other configurations.

### Features

* add support for Alibaba Cloud KMS Secret Manager ([#355](https://github.com/external-secrets/kubernetes-external-secrets/issues/355)) ([cceb40b](https://github.com/external-secrets/kubernetes-external-secrets/commit/cceb40b8fe797899c3309673434da25adce1bacf))
* Chart optionally installs CRD / CR Manager configurable for more strict clusters ([#344](https://github.com/external-secrets/kubernetes-external-secrets/issues/344)) ([131e201](https://github.com/external-secrets/kubernetes-external-secrets/commit/131e2018b9013f2b84da41806b9359934f78e449))


### Bug Fixes

* **vault:** follow all redirects to support vault HA ([#394](https://github.com/external-secrets/kubernetes-external-secrets/issues/394)) ([a05aa92](https://github.com/external-secrets/kubernetes-external-secrets/commit/a05aa928b438e2da43bf04e9a8a99eb60e694967))
* don't set GOOGLE_APPLICATION_CREDENTIALS by default and update README for Google Secret Manager ([#371](https://github.com/external-secrets/kubernetes-external-secrets/issues/371)) ([e9db0f8](https://github.com/external-secrets/kubernetes-external-secrets/commit/e9db0f8a875db0c5054463c6fa4d02467e705bbd))
* Handle JSON in GCP Secrets Manager ([#373](https://github.com/external-secrets/kubernetes-external-secrets/issues/373)) ([4273598](https://github.com/external-secrets/kubernetes-external-secrets/commit/4273598a35b96b5f054630026dcaf5ec1aa59baf))

## [3.3.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/3.2.0...3.3.0) (2020-05-01)


### Features

* add last_state metric ([#357](https://github.com/external-secrets/kubernetes-external-secrets/issues/357)) ([1d9d237](https://github.com/external-secrets/kubernetes-external-secrets/commit/1d9d237618cf6b027ef16d0d201a3b06723a1a6e))
* enable use of AWS STS regional endpoints ([#348](https://github.com/external-secrets/kubernetes-external-secrets/issues/348)) ([9a46773](https://github.com/external-secrets/kubernetes-external-secrets/commit/9a467737a88b186a2791595aed0a5712592026c3))
* improve out-of-the-box compatibility with clusters running locked down PodSecurityPolicy enabling runAsNonRoot by default ([#361](https://github.com/external-secrets/kubernetes-external-secrets/issues/361)) ([27ba7e1](https://github.com/external-secrets/kubernetes-external-secrets/commit/27ba7e1551c3a34091301dad6d31c8854397837d))
* support isBinary for GCP ([#353](https://github.com/external-secrets/kubernetes-external-secrets/issues/353)) ([de20a1b](https://github.com/external-secrets/kubernetes-external-secrets/commit/de20a1bf471562ac530e10239665961189026c33)), closes [#352](https://github.com/external-secrets/kubernetes-external-secrets/issues/352)


### Bug Fixes

* **deps:** update dependency kubernetes-client to v9 ([#367](https://github.com/external-secrets/kubernetes-external-secrets/issues/367)) ([f06bd59](https://github.com/external-secrets/kubernetes-external-secrets/commit/f06bd595d3957c25d392ba70d90410eb17f5f4c8))
* **deps:** update dependency pino to v6 ([#322](https://github.com/external-secrets/kubernetes-external-secrets/issues/322)) ([3664540](https://github.com/external-secrets/kubernetes-external-secrets/commit/36645402c24b446ff232b8ec6930593c5131756c))
* **deps:** update dependency prom-client to v12 ([#323](https://github.com/external-secrets/kubernetes-external-secrets/issues/323)) ([504ed6c](https://github.com/external-secrets/kubernetes-external-secrets/commit/504ed6cfbbcdcbdd1b91cb6baf01e5cb6ceabc66))

## [3.2.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/3.1.0...3.2.0) (2020-03-27)


### Features

* add GCP support ([#312](https://github.com/external-secrets/kubernetes-external-secrets/issues/312)) ([5b41ad0](https://github.com/external-secrets/kubernetes-external-secrets/commit/5b41ad0e8af02d081d984ede77e67e8578581b92))


### Bug Fixes

* **azure-registry:** handle binary files ([#311](https://github.com/external-secrets/kubernetes-external-secrets/issues/311)) ([9727d48](https://github.com/external-secrets/kubernetes-external-secrets/commit/9727d48740b4056cfd4788a6344e0961c5c228c0))
* stringify json object based secrets ([#247](https://github.com/external-secrets/kubernetes-external-secrets/issues/247)) ([828d0ce](https://github.com/external-secrets/kubernetes-external-secrets/commit/828d0ced9ed1d8c65457be256b946272719e9067))
* upgrade aws-sdk from 2.575.0 to 2.628.0 ([#305](https://github.com/external-secrets/kubernetes-external-secrets/issues/305)) ([149e33a](https://github.com/external-secrets/kubernetes-external-secrets/commit/149e33afcc51801df4df1694a07e855efe0b12b8))
* upgrade pino from 5.13.6 to 5.16.0 ([#306](https://github.com/external-secrets/kubernetes-external-secrets/issues/306)) ([be74814](https://github.com/external-secrets/kubernetes-external-secrets/commit/be74814ef743632f6ba099cfbc7a7b7c451cc66e))
* verify dataFrom property in naming convention verification ([#292](https://github.com/external-secrets/kubernetes-external-secrets/issues/292)) ([f26bf2b](https://github.com/external-secrets/kubernetes-external-secrets/commit/f26bf2bb14cfc7f6827e53550c8474b89133bc45))

## [3.1.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/3.0.0...3.1.0) (2020-02-06)

## [3.0.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/2.2.1...3.0.0) (2020-01-09)


### Features

* **release:** use same version for app and chart release ([#242](https://github.com/external-secrets/kubernetes-external-secrets/issues/242)) ([2000864](https://github.com/external-secrets/kubernetes-external-secrets/commit/20008648857296b5a91e67c9e0197712a3a2eb19))
* allow enforcing naming conventions for key names, limiting which keys can be fetched from backends ([#230](https://github.com/external-secrets/kubernetes-external-secrets/issues/230)) ([c4fdea6](https://github.com/external-secrets/kubernetes-external-secrets/commit/c4fdea666fc75eabdcdbf1a863902f295864b740)), closes [#178](https://github.com/external-secrets/kubernetes-external-secrets/issues/178) [#178](https://github.com/external-secrets/kubernetes-external-secrets/issues/178) [#178](https://github.com/external-secrets/kubernetes-external-secrets/issues/178)


### Bug Fixes

* default service account annotation value ([#252](https://github.com/external-secrets/kubernetes-external-secrets/issues/252)) ([b163a69](https://github.com/external-secrets/kubernetes-external-secrets/commit/b163a6908d1de0ca956acbbdbd38de798bbcf784))
* remove required top level key from vault backend validation ([#255](https://github.com/external-secrets/kubernetes-external-secrets/issues/255)) ([e567117](https://github.com/external-secrets/kubernetes-external-secrets/commit/e5671179934d1cb97ff31772ba0b804047448161))

### [2.2.1](https://github.com/external-secrets/kubernetes-external-secrets/compare/2.2.0...2.2.1) (2019-12-06)


### Bug Fixes

* do not skew binary data ([#244](https://github.com/external-secrets/kubernetes-external-secrets/issues/244)) ([01e0ca2](https://github.com/external-secrets/kubernetes-external-secrets/commit/01e0ca21556a7281c9affb0b2d48e1a413e04b12))
* **chart:** remove one of the duplicate securityContext ([#222](https://github.com/external-secrets/kubernetes-external-secrets/issues/222)) ([2b54f34](https://github.com/external-secrets/kubernetes-external-secrets/commit/2b54f34ce8b8c962657b8b7a7fb6da9aa82dba7e))
* bump pino and sub dependency flatstr, fixes [#218](https://github.com/external-secrets/kubernetes-external-secrets/issues/218) ([#219](https://github.com/external-secrets/kubernetes-external-secrets/issues/219)) ([db3491b](https://github.com/external-secrets/kubernetes-external-secrets/commit/db3491bea7ad67a592b8c0bea3956d79ef9cb561))
* **kv-backend:** Add empty keyOptions for dataFrom case. ([#221](https://github.com/external-secrets/kubernetes-external-secrets/issues/221)) ([8e838ee](https://github.com/external-secrets/kubernetes-external-secrets/commit/8e838eef04f654510aed957c914e128e2fdcd690))

## [2.2.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/2.1.0...2.2.0) (2019-11-14)


### Features

* implement basic e2e tests ([#207](https://github.com/external-secrets/kubernetes-external-secrets/issues/207)) ([dfa210b](https://github.com/external-secrets/kubernetes-external-secrets/commit/dfa210b955bd5d67790f6f99a08d812574e5ecd9))
* **chart:** support mounting existing secrets as files ([#213](https://github.com/external-secrets/kubernetes-external-secrets/issues/213)) ([ac9b9e2](https://github.com/external-secrets/kubernetes-external-secrets/commit/ac9b9e2a1cc2d69fed87b725b4ccd25f7ad5df97))
* **secrets-manager:** Added support for secrets versioning in Secrets Manager using version stage labels ([#181](https://github.com/external-secrets/kubernetes-external-secrets/issues/181)) ([9d6c2f9](https://github.com/external-secrets/kubernetes-external-secrets/commit/9d6c2f9aefedc0a8b9f6db9f0a43592e6280e93d))
* add validation to CRD ([#208](https://github.com/external-secrets/kubernetes-external-secrets/issues/208)) ([d2ebaeb](https://github.com/external-secrets/kubernetes-external-secrets/commit/d2ebaeba6ea40d1167944923c835942d550d0e3d))
* allow disabling of interval polling ([#211](https://github.com/external-secrets/kubernetes-external-secrets/issues/211)) ([9441216](https://github.com/external-secrets/kubernetes-external-secrets/commit/944121605bc93661ad3934026383e738660085b4))


### Bug Fixes

* **script:** remove external-secrets.yml patching from release.sh ([#216](https://github.com/external-secrets/kubernetes-external-secrets/issues/216)) ([9d871cd](https://github.com/external-secrets/kubernetes-external-secrets/commit/9d871cda830d39ed37c95f425a26ff92821bb30d))
* add dataFrom support to vault backend (refactor kv-backend) ([#206](https://github.com/external-secrets/kubernetes-external-secrets/issues/206)) ([24421b9](https://github.com/external-secrets/kubernetes-external-secrets/commit/24421b925e52a3930097a14b8727bb54560d2632))
* status update conflicts should not cause crash, fixes [#199](https://github.com/external-secrets/kubernetes-external-secrets/issues/199) ([#215](https://github.com/external-secrets/kubernetes-external-secrets/issues/215)) ([e6171c8](https://github.com/external-secrets/kubernetes-external-secrets/commit/e6171c89fab703c14341e015cabc10a2cf6c66f4))
* Stringify JSON response for compatibility with KV backend ([#214](https://github.com/external-secrets/kubernetes-external-secrets/issues/214)) ([5527530](https://github.com/external-secrets/kubernetes-external-secrets/commit/552753062e7b6357bd4bf918d3181fab79d59795))

## [2.1.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/1.6.0...2.1.0) (2019-11-08)


### Features

* **vault:** Support for Hashicorp Vault ([#198](https://github.com/external-secrets/kubernetes-external-secrets/issues/198)) ([d61312c](https://github.com/external-secrets/kubernetes-external-secrets/commit/d61312cbeeaf4d9546db55042a0f62ba6702b7ae))
* add status subresource with last sync and generation tracking ([#133](https://github.com/external-secrets/kubernetes-external-secrets/issues/133)) ([8db1749](https://github.com/external-secrets/kubernetes-external-secrets/commit/8db1749ebacf3d070d744587b36f9e60e9af42c6))
* add support for dataFrom & fix: encoding of non-string values ([#196](https://github.com/external-secrets/kubernetes-external-secrets/issues/196)) ([90f01c5](https://github.com/external-secrets/kubernetes-external-secrets/commit/90f01c59d3407ed0371e9f2682b936358c31b104))
* allow setting additional markup on generated secret resource using template ([#192](https://github.com/external-secrets/kubernetes-external-secrets/issues/192)) ([25e2f74](https://github.com/external-secrets/kubernetes-external-secrets/commit/25e2f7426ee9bedeffe02e7d8e8befd07fedad30))
* make role-scope annotation configurable &  fix: allow missing roleArn even if annotations are set  ([#179](https://github.com/external-secrets/kubernetes-external-secrets/issues/179)) ([8c17819](https://github.com/external-secrets/kubernetes-external-secrets/commit/8c178191e73eb965c764afbd95df99c168d4ebe3)), closes [#174](https://github.com/external-secrets/kubernetes-external-secrets/issues/174) [#174](https://github.com/external-secrets/kubernetes-external-secrets/issues/174)
* support Secret Binary from AWS Secrets Manager ([#197](https://github.com/external-secrets/kubernetes-external-secrets/issues/197)) ([731edb1](https://github.com/external-secrets/kubernetes-external-secrets/commit/731edb1e5c596f676d0c73a3449b7895a5fb1568))
* Update aws-sdk to enable IRSA (AWS IAM Roles for ServiceAccounts) support, add securityContext to helm chart  ([#200](https://github.com/external-secrets/kubernetes-external-secrets/issues/200)) ([165662c](https://github.com/external-secrets/kubernetes-external-secrets/commit/165662cf84130d2917425f020872372d8996ce69))
* use spec in external secret resource, keeping secretDescriptor for backwards compat ([#204](https://github.com/external-secrets/kubernetes-external-secrets/issues/204)) ([a2a9dff](https://github.com/external-secrets/kubernetes-external-secrets/commit/a2a9dff821144ccebd1c998babbc83ea5c25eb89))


### Bug Fixes

* add missing rbac rules to external-secrets.yml ([#195](https://github.com/external-secrets/kubernetes-external-secrets/issues/195)) ([b6d8229](https://github.com/external-secrets/kubernetes-external-secrets/commit/b6d82292767174998ffd4f48c99e95b00ddbec67))
* **script:** fix release scripts ([#186](https://github.com/external-secrets/kubernetes-external-secrets/issues/186)) ([238ebd6](https://github.com/external-secrets/kubernetes-external-secrets/commit/238ebd685cdc0fde62190f2b391162a529ee2848))
* RBAC config to access namespaces ([#177](https://github.com/external-secrets/kubernetes-external-secrets/issues/177)) ([9605756](https://github.com/external-secrets/kubernetes-external-secrets/commit/96057567e2e6c2b7aa5e3b96750e40efe282c98b))

## [1.6.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/1.5.0...1.6.0) (2019-10-23)


### Features

* add option to assume role ([#144](https://github.com/external-secrets/kubernetes-external-secrets/issues/144)) ([f0ce6ed](https://github.com/external-secrets/kubernetes-external-secrets/commit/f0ce6ed22082e31c64ecb99f8f3e5acdf0038e7f))

## [1.5.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/1.4.0...1.5.0) (2019-09-27)


### Features

* basic metrics ([#147](https://github.com/external-secrets/kubernetes-external-secrets/issues/147)) ([ded6d31](https://github.com/external-secrets/kubernetes-external-secrets/commit/ded6d3168f81c6a1afcb811a17e331ccd606eb1d))

## [1.4.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/1.3.1...1.4.0) (2019-09-27)


### Features

* allow setting type in external secret to support other than Opaque secrets ([#130](https://github.com/external-secrets/kubernetes-external-secrets/issues/130)) ([226697a](https://github.com/external-secrets/kubernetes-external-secrets/commit/226697a43f3cc73224c73b9c69411df776bcb8c8))


### Bug Fixes

* **daemon:** Upsert secrets immediately poller added  ([a986dfb](https://github.com/external-secrets/kubernetes-external-secrets/commit/a986dfba1c96679faab0097b96c5f77e4deb8dca))

### [1.3.1](https://github.com/external-secrets/kubernetes-external-secrets/compare/1.3.0...1.3.1) (2019-07-18)


### Bug Fixes

* **secret:** fix SSM parameter store code ([e5e635f](https://github.com/external-secrets/kubernetes-external-secrets/commit/e5e635f5bd02146cebe01399ed1c493d4ff43173))

## [1.3.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/1.2.3...1.3.0) (2019-06-22)


### Features

* **secret:** add ownerreference to remove created secret when external secret is removed ([#95](https://github.com/external-secrets/kubernetes-external-secrets/issues/95)) ([66af903](https://github.com/external-secrets/kubernetes-external-secrets/commit/66af903ed7fe0ceae0111f9aa4b2c4574b799d28))


### Bug Fixes

* remove logging of potentially secret value ([#96](https://github.com/external-secrets/kubernetes-external-secrets/issues/96)) ([6063f79](https://github.com/external-secrets/kubernetes-external-secrets/commit/6063f79fde24c70da06c33558964c5610494ca19))

### [1.2.3](https://github.com/external-secrets/kubernetes-external-secrets/compare/1.2.2...1.2.3) (2019-06-06)


### Bug Fixes

* **logging:** show error on missing property ([#87](https://github.com/external-secrets/kubernetes-external-secrets/issues/87)) ([ef8bd5f](https://github.com/external-secrets/kubernetes-external-secrets/commit/ef8bd5f01c5f7a23bb076bc9073b932edcff391b))

### [1.2.2](https://github.com/external-secrets/kubernetes-external-secrets/compare/1.2.1...1.2.2) (2019-06-03)


### Bug Fixes

* **AWSSM:** treat value as object iff the es specifies .property ([#74](https://github.com/external-secrets/kubernetes-external-secrets/issues/74)) ([1d5a9dd](https://github.com/external-secrets/kubernetes-external-secrets/commit/1d5a9ddc8deb06bcadf97ffcf526b79af968a4c0))

### [1.2.1](https://github.com/external-secrets/kubernetes-external-secrets/compare/1.2.0...1.2.1) (2019-05-20)


### Bug Fixes

* **config:** remove default aws region ([#54](https://github.com/external-secrets/kubernetes-external-secrets/issues/54)) ([4584a09](https://github.com/external-secrets/kubernetes-external-secrets/commit/4584a096db98a4d7cdd72dc9af62c0d28cf72a69))
* **package:** update kubernetes-client to version 7.0.0 ([#49](https://github.com/external-secrets/kubernetes-external-secrets/issues/49)) ([eeb7acf](https://github.com/external-secrets/kubernetes-external-secrets/commit/eeb7acf4201066e92f267e6b42747c25cba8d3d0))

## [1.2.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/1.1.0...1.2.0) (2019-04-09)


### Features

* **data:** support `.data` in the `secretDescriptor` ([#40](https://github.com/external-secrets/kubernetes-external-secrets/issues/40)) ([4887469](https://github.com/external-secrets/kubernetes-external-secrets/commit/488746937ce9e1aba316137619ffb306080645da))


### Bug Fixes

* **package:** update make-promises-safe to version 5.0.0 ([#33](https://github.com/external-secrets/kubernetes-external-secrets/issues/33)) ([a25b1d2](https://github.com/external-secrets/kubernetes-external-secrets/commit/a25b1d23b685d4676ad3223b1b80d0e9727cdc57))

## [1.1.0](https://github.com/external-secrets/kubernetes-external-secrets/compare/bcb1ad134f1638be866f7aedffc88de35da8cfff...1.1.0) (2019-03-14)


### Features

* **cicd:** add .travis.yml file ([#9](https://github.com/external-secrets/kubernetes-external-secrets/issues/9)) ([fbe52b3](https://github.com/external-secrets/kubernetes-external-secrets/commit/fbe52b379aa8bae40a47626b43232e6ca176b103))
* **deploy:** move deploy resources into single file ([#5](https://github.com/external-secrets/kubernetes-external-secrets/issues/5)) ([a264f2c](https://github.com/external-secrets/kubernetes-external-secrets/commit/a264f2c61052323f3e14b5f75e934d9c0db506c6))
* **examples:** add hello-service example ([#6](https://github.com/external-secrets/kubernetes-external-secrets/issues/6)) ([af5b1d2](https://github.com/external-secrets/kubernetes-external-secrets/commit/af5b1d2f4d66b906b68c5e73cf86342d1678c266))
* **json:** support JSON objects in AWS Secret Manager ([#13](https://github.com/external-secrets/kubernetes-external-secrets/issues/13)) ([cd7130f](https://github.com/external-secrets/kubernetes-external-secrets/commit/cd7130f35f034b03892cd3c31acdf05c4b10493c))
* **project:** add nodemon for development ([#7](https://github.com/external-secrets/kubernetes-external-secrets/issues/7)) ([ec25cbd](https://github.com/external-secrets/kubernetes-external-secrets/commit/ec25cbd64ca243672bb62dfb8864098a3056f861))


### Bug Fixes

* **backends:** fix secretsManager backend name ([#27](https://github.com/external-secrets/kubernetes-external-secrets/issues/27)) ([d494edf](https://github.com/external-secrets/kubernetes-external-secrets/commit/d494edf4a84f835764b8a501c97fb821a216e3a4))
* **deploy:** fix deployment file ([#4](https://github.com/external-secrets/kubernetes-external-secrets/issues/4)) ([bcb1ad1](https://github.com/external-secrets/kubernetes-external-secrets/commit/bcb1ad134f1638be866f7aedffc88de35da8cfff))
* **dockerfile:** remove broken commands ([#3](https://github.com/external-secrets/kubernetes-external-secrets/issues/3)) ([7901f90](https://github.com/external-secrets/kubernetes-external-secrets/commit/7901f90cb0f8431e2c3379b8e118f71568c77a7b))
* **rbac:** adjust the poller upsert code so it doesn't need `get` ([#22](https://github.com/external-secrets/kubernetes-external-secrets/issues/22)) ([5cffe97](https://github.com/external-secrets/kubernetes-external-secrets/commit/5cffe970ac42cfeae1785d9c74750200367d3977))
* **typo:** fix typo in external secrets name ([#8](https://github.com/external-secrets/kubernetes-external-secrets/issues/8)) ([e26f75c](https://github.com/external-secrets/kubernetes-external-secrets/commit/e26f75ca3c56b5f6dba13d581f28bdda3cd28efc))
* **updating:** use PUT not PATCH when updating an existing Secret ([#20](https://github.com/external-secrets/kubernetes-external-secrets/issues/20)) ([856d8e0](https://github.com/external-secrets/kubernetes-external-secrets/commit/856d8e07370f8fd69546eb50043556e2cd35448e))
