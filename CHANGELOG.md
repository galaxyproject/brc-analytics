# Changelog

## [0.8.0](https://github.com/galaxyproject/brc-analytics/compare/v0.7.0...v0.8.0) (2025-03-20)


### Features

* add realm to taxonomic lineage filters ([#389](https://github.com/galaxyproject/brc-analytics/issues/389)) ([#390](https://github.com/galaxyproject/brc-analytics/issues/390)) ([0d96267](https://github.com/galaxyproject/brc-analytics/commit/0d96267c7136b0293fc1ddcf0d6b776640bba1e5))
* allow limiting workflows by taxonomy id ([#356](https://github.com/galaxyproject/brc-analytics/issues/356)) ([#369](https://github.com/galaxyproject/brc-analytics/issues/369)) ([364876f](https://github.com/galaxyproject/brc-analytics/commit/364876f1922018b36363c129d09db113caf3914d))
* build catalog and add qc report ([#344](https://github.com/galaxyproject/brc-analytics/issues/344)) ([#364](https://github.com/galaxyproject/brc-analytics/issues/364)) ([a3a70ca](https://github.com/galaxyproject/brc-analytics/commit/a3a70cad6a777071fbc0a62329b74bdb737dffd8))
* remove retired ncbi superkingdom rank and add domain ([#385](https://github.com/galaxyproject/brc-analytics/issues/385)) ([#386](https://github.com/galaxyproject/brc-analytics/issues/386)) ([a7af98a](https://github.com/galaxyproject/brc-analytics/commit/a7af98abc9863ff7f4e046b69cbe72b8e2f2a571))
* update workflows from IWC manifest and set assembly-specific parameters ([#351](https://github.com/galaxyproject/brc-analytics/issues/351), [#339](https://github.com/galaxyproject/brc-analytics/issues/339)) ([#342](https://github.com/galaxyproject/brc-analytics/issues/342)) ([f5720a8](https://github.com/galaxyproject/brc-analytics/commit/f5720a8a42526db46f47c9af43d61522e76dd4ee))


### Bug Fixes

* avoid assembly duplication due to duplicate taxonomy ids and add checks for duplicate entity ids ([#367](https://github.com/galaxyproject/brc-analytics/issues/367)) ([#368](https://github.com/galaxyproject/brc-analytics/issues/368)) ([e625081](https://github.com/galaxyproject/brc-analytics/commit/e62508112a7b95d4e254f0926c3aa3c03d4693d1))
* use correct variant calling landing body even when gene model url is absent ([#347](https://github.com/galaxyproject/brc-analytics/issues/347)) ([#365](https://github.com/galaxyproject/brc-analytics/issues/365)) ([038d76e](https://github.com/galaxyproject/brc-analytics/commit/038d76e56d5ed586d82a18dffff331ba6651f951))


### Chores

* add .venv to prettier ignore list ([28981f7](https://github.com/galaxyproject/brc-analytics/commit/28981f7582972fca554d5980b4cfdbee70b40ba1))
* add .venv to prettier ignore list ([#373](https://github.com/galaxyproject/brc-analytics/issues/373)) ([#374](https://github.com/galaxyproject/brc-analytics/issues/374)) ([28981f7](https://github.com/galaxyproject/brc-analytics/commit/28981f7582972fca554d5980b4cfdbee70b40ba1))
* remove issue number check from commit message validation ([bba7273](https://github.com/galaxyproject/brc-analytics/commit/bba72730d9223f041c1b8c527ae16d709f71097f))
* Remove issue number check from husky ([#363](https://github.com/galaxyproject/brc-analytics/issues/363)) ([#372](https://github.com/galaxyproject/brc-analytics/issues/372)) ([bba7273](https://github.com/galaxyproject/brc-analytics/commit/bba72730d9223f041c1b8c527ae16d709f71097f))
* rename genomes.json to assemblies.json ([#343](https://github.com/galaxyproject/brc-analytics/issues/343)) ([#360](https://github.com/galaxyproject/brc-analytics/issues/360)) ([bebcfb2](https://github.com/galaxyproject/brc-analytics/commit/bebcfb265ed4ee8c7990db795425b2c863c01d91))
* replace HTML scraping with API calls ([#346](https://github.com/galaxyproject/brc-analytics/issues/346)) ([#378](https://github.com/galaxyproject/brc-analytics/issues/378)) ([6b6c3c0](https://github.com/galaxyproject/brc-analytics/commit/6b6c3c0998ba96d48e085e3d6383dc60ce28fbcd))
* update findable-ui to latest v22.0.0 ([#391](https://github.com/galaxyproject/brc-analytics/issues/391)) ([#395](https://github.com/galaxyproject/brc-analytics/issues/395)) ([8ee5a6a](https://github.com/galaxyproject/brc-analytics/commit/8ee5a6a9196c01fd12dbe25bbe935e144bbeb002))


### Content

* explain 'free' compute at tacc ([#237](https://github.com/galaxyproject/brc-analytics/issues/237)) ([#370](https://github.com/galaxyproject/brc-analytics/issues/370)) ([39bab23](https://github.com/galaxyproject/brc-analytics/commit/39bab23b119d76cab8f28e1785f6ada9db7f1c70))
* remove cards from the carousel/card deck ([#403](https://github.com/galaxyproject/brc-analytics/issues/403)) ([#404](https://github.com/galaxyproject/brc-analytics/issues/404)) ([9f4f70e](https://github.com/galaxyproject/brc-analytics/commit/9f4f70ef000dec064784a7d21f37658609a934fa))


### Continuous Integration

* add github action and workflow to check pr title for commit message format ([#377](https://github.com/galaxyproject/brc-analytics/issues/377)) ([#380](https://github.com/galaxyproject/brc-analytics/issues/380)) ([b128499](https://github.com/galaxyproject/brc-analytics/commit/b1284998dc50f9f54a703e9df2efd687b3f04bf7))
* fix linkml checks so that they exit with failure if the check fails for any file ([#341](https://github.com/galaxyproject/brc-analytics/issues/341)) ([#376](https://github.com/galaxyproject/brc-analytics/issues/376)) ([a450ea5](https://github.com/galaxyproject/brc-analytics/commit/a450ea515c5ab03ff5874a35914e60c1ce5d8e05))

## [0.7.0](https://github.com/galaxyproject/brc-analytics/compare/v0.6.0...v0.7.0) (2025-03-03)


### Features

* add back all assemblies ([#323](https://github.com/galaxyproject/brc-analytics/issues/323)) ([#340](https://github.com/galaxyproject/brc-analytics/issues/340)) ([6bff3c8](https://github.com/galaxyproject/brc-analytics/commit/6bff3c898f00b206056f144484ee04d1cc87d4a9))
* add filters for taxonomic levels to organisms list ([#301](https://github.com/galaxyproject/brc-analytics/issues/301)) ([#306](https://github.com/galaxyproject/brc-analytics/issues/306)) ([665a20a](https://github.com/galaxyproject/brc-analytics/commit/665a20afb8bfdf1dc0aba4c32841f0bbd379902b))
* add taxonomic levels to assembly list ([#312](https://github.com/galaxyproject/brc-analytics/issues/312)) ([#316](https://github.com/galaxyproject/brc-analytics/issues/316)) ([06bdb3c](https://github.com/galaxyproject/brc-analytics/commit/06bdb3ce1765e43123da5199a03d3c7093fee83e))
* added additional workflows ([#322](https://github.com/galaxyproject/brc-analytics/issues/322)) ([#335](https://github.com/galaxyproject/brc-analytics/issues/335)) ([8cab2ad](https://github.com/galaxyproject/brc-analytics/commit/8cab2ad655282fea804c2c6378d7601e4fa38765))
* allow organisms to have multiple ploidies separately matched with workflows ([#334](https://github.com/galaxyproject/brc-analytics/issues/334)) ([#338](https://github.com/galaxyproject/brc-analytics/issues/338)) ([7ce865a](https://github.com/galaxyproject/brc-analytics/commit/7ce865ab35cc161e7dea08178998c766b3af3aef))


### Styles

* fix prettierignoring of catalog files ([#317](https://github.com/galaxyproject/brc-analytics/issues/317)) ([#318](https://github.com/galaxyproject/brc-analytics/issues/318)) ([9c97653](https://github.com/galaxyproject/brc-analytics/commit/9c97653ca99ebb307c9092e810009b720f42ac6e))

## [0.6.0](https://github.com/galaxyproject/brc-analytics/compare/v0.5.1...v0.6.0) (2025-02-18)


### Features

* add instructions section to home page ([#278](https://github.com/galaxyproject/brc-analytics/issues/278)) ([#303](https://github.com/galaxyproject/brc-analytics/issues/303)) ([173f3b1](https://github.com/galaxyproject/brc-analytics/commit/173f3b14f28c3fbad08bdc0d08c1a7697d0d7099))
* add linkml schemas for data source files ([#269](https://github.com/galaxyproject/brc-analytics/issues/269), [#270](https://github.com/galaxyproject/brc-analytics/issues/270)) ([#283](https://github.com/galaxyproject/brc-analytics/issues/283)) ([b208c53](https://github.com/galaxyproject/brc-analytics/commit/b208c53dba820b2d232cdd14047a04fa994a0264))
* create catalog build python package ([#251](https://github.com/galaxyproject/brc-analytics/issues/251)) ([#258](https://github.com/galaxyproject/brc-analytics/issues/258)) ([c31cf6e](https://github.com/galaxyproject/brc-analytics/commit/c31cf6ece2d9e316471a42688fd945445a5bc19f))
* derive workflows from yaml files ([#260](https://github.com/galaxyproject/brc-analytics/issues/260)) ([#265](https://github.com/galaxyproject/brc-analytics/issues/265)) ([0b42fd7](https://github.com/galaxyproject/brc-analytics/commit/0b42fd71cad4fb552be44b36ae87dbbff1588f38))
* fetch raw/primary data information from sra ([#295](https://github.com/galaxyproject/brc-analytics/issues/295)) ([5ded790](https://github.com/galaxyproject/brc-analytics/commit/5ded7902ee02693e4b9c1c547c14a3cda913e7fa))
* move assembly species from breadcrumbs to subtitle ([#276](https://github.com/galaxyproject/brc-analytics/issues/276)) ([#280](https://github.com/galaxyproject/brc-analytics/issues/280)) ([aedfc32](https://github.com/galaxyproject/brc-analytics/commit/aedfc32eef1635c040fc14e25949118a67d33110))
* only show workflows with compatible ploidies ([#297](https://github.com/galaxyproject/brc-analytics/issues/297)) ([#299](https://github.com/galaxyproject/brc-analytics/issues/299)) ([9e2e04c](https://github.com/galaxyproject/brc-analytics/commit/9e2e04c832fe2c9cab6d28ecff42e7560e630f7a))
* support multiple analysis methods per category ([#279](https://github.com/galaxyproject/brc-analytics/issues/279)) ([#296](https://github.com/galaxyproject/brc-analytics/issues/296)) ([57d55db](https://github.com/galaxyproject/brc-analytics/commit/57d55dbb13b5efbe00c73651b4445ef68775e727))
* update workflow card for "Launch Galaxy" button ([#300](https://github.com/galaxyproject/brc-analytics/issues/300)) ([#302](https://github.com/galaxyproject/brc-analytics/issues/302)) ([1004775](https://github.com/galaxyproject/brc-analytics/commit/1004775a5c54c58f8ed78ccdfbfbb1b547fb926c))


### Chores

* delete unused `build-genomes-files.py` ([#267](https://github.com/galaxyproject/brc-analytics/issues/267)) ([#274](https://github.com/galaxyproject/brc-analytics/issues/274)) ([4032561](https://github.com/galaxyproject/brc-analytics/commit/4032561b6bb2425635c596074b004094eb3acb20))


### Content

* update main page ([#243](https://github.com/galaxyproject/brc-analytics/issues/243)) ([#259](https://github.com/galaxyproject/brc-analytics/issues/259)) ([bbdee9f](https://github.com/galaxyproject/brc-analytics/commit/bbdee9f6b06787eedc80304194043a06b2ba679d))


### Documentation

* add instructions for building the catalog and adding assemblies ([#266](https://github.com/galaxyproject/brc-analytics/issues/266)) ([#268](https://github.com/galaxyproject/brc-analytics/issues/268)) ([56110b9](https://github.com/galaxyproject/brc-analytics/commit/56110b9761d6317692dd08e7125079d927a011df))


### Code Refactoring

* remove unused workflows from catalog ([#272](https://github.com/galaxyproject/brc-analytics/issues/272)) ([#273](https://github.com/galaxyproject/brc-analytics/issues/273)) ([9d37334](https://github.com/galaxyproject/brc-analytics/commit/9d3733411910f9f7226feab67b78a054e2490205))
* reorganize catalog folders ([#271](https://github.com/galaxyproject/brc-analytics/issues/271)) ([#281](https://github.com/galaxyproject/brc-analytics/issues/281)) ([b9e3a38](https://github.com/galaxyproject/brc-analytics/commit/b9e3a388992571dcde540e494a4bcf9c6e59b721))

## [0.5.1](https://github.com/galaxyproject/brc-analytics/compare/v0.5.0...v0.5.1) (2025-02-03)


### Content

* cleanup NCBI icon on the assemblies page ([#248](https://github.com/galaxyproject/brc-analytics/issues/248)) ([#249](https://github.com/galaxyproject/brc-analytics/issues/249)) ([97472c9](https://github.com/galaxyproject/brc-analytics/commit/97472c93383052391bf79d86b834edde73fc2f8a))

## [0.5.0](https://github.com/galaxyproject/brc-analytics/compare/v0.4.0...v0.5.0) (2025-01-31)


### Features

* add environment-specific galaxy urls ([#239](https://github.com/galaxyproject/brc-analytics/issues/239)) ([#241](https://github.com/galaxyproject/brc-analytics/issues/241)) ([cf9d95d](https://github.com/galaxyproject/brc-analytics/commit/cf9d95d61573debae3e56db3292b35aa85f315ea))
* remove "Preview" chip from analysis methods ([#245](https://github.com/galaxyproject/brc-analytics/issues/245)) ([#247](https://github.com/galaxyproject/brc-analytics/issues/247)) ([d79390a](https://github.com/galaxyproject/brc-analytics/commit/d79390a61d9141bfed9c477110e26ffb93da8dfe))

## [0.4.0](https://github.com/galaxyproject/brc-analytics/compare/v0.3.1...v0.4.0) (2025-01-27)


### Features

* add github link to header and footer ([#234](https://github.com/galaxyproject/brc-analytics/issues/234)) ([#238](https://github.com/galaxyproject/brc-analytics/issues/238)) ([d107863](https://github.com/galaxyproject/brc-analytics/commit/d107863da4979d35fb05b6ba272fd5afc127a948))
* add organism group to entity lists and filters ([#236](https://github.com/galaxyproject/brc-analytics/issues/236)) ([#240](https://github.com/galaxyproject/brc-analytics/issues/240)) ([79def41](https://github.com/galaxyproject/brc-analytics/commit/79def410cf0cefcf9621be2126df8fd0a09a766b))
* link to organism page from assembly list and detail ([#231](https://github.com/galaxyproject/brc-analytics/issues/231)) ([#232](https://github.com/galaxyproject/brc-analytics/issues/232)) ([15bace5](https://github.com/galaxyproject/brc-analytics/commit/15bace5f4334151333aea3e3a4331ac5ef7cea47))

## [0.3.1](https://github.com/galaxyproject/brc-analytics/compare/v0.3.0...v0.3.1) (2025-01-23)


### Code Refactoring

* get accessions from yaml file when building catalog source ([#228](https://github.com/galaxyproject/brc-analytics/issues/228)) ([#229](https://github.com/galaxyproject/brc-analytics/issues/229)) ([bb79f88](https://github.com/galaxyproject/brc-analytics/commit/bb79f885782fd920b02cab0b157276bb0a4fb129))

## [0.3.0](https://github.com/galaxyproject/brc-analytics/compare/v0.2.0...v0.3.0) (2025-01-22)


### Features

* update analysis methods heading ([#225](https://github.com/galaxyproject/brc-analytics/issues/225)) ([#226](https://github.com/galaxyproject/brc-analytics/issues/226)) ([a1bd78f](https://github.com/galaxyproject/brc-analytics/commit/a1bd78f78af2e2cc00c52727180a6dba2df79b9b))

## [0.2.0](https://github.com/galaxyproject/brc-analytics/compare/v0.1.0...v0.2.0) (2025-01-21)


### Features

* add other fields to assembly details ([#213](https://github.com/galaxyproject/brc-analytics/issues/213)) ([#219](https://github.com/galaxyproject/brc-analytics/issues/219)) ([c53cba3](https://github.com/galaxyproject/brc-analytics/commit/c53cba3668f740cda113f673175f234f9855dfc4))
* move resources to top of assembly side column ([#222](https://github.com/galaxyproject/brc-analytics/issues/222)) ([#224](https://github.com/galaxyproject/brc-analytics/issues/224)) ([7cd75d2](https://github.com/galaxyproject/brc-analytics/commit/7cd75d2f60e2035ad5ec0f5b42e5cf4d9722e4f0))
* rename analysis portals to resources and add ncbi links ([#214](https://github.com/galaxyproject/brc-analytics/issues/214)) ([#220](https://github.com/galaxyproject/brc-analytics/issues/220)) ([3c12dea](https://github.com/galaxyproject/brc-analytics/commit/3c12dea03ebe855ea7b67f1436dd1cae4387c82b))
* update organism detail page ([#212](https://github.com/galaxyproject/brc-analytics/issues/212)) ([#217](https://github.com/galaxyproject/brc-analytics/issues/217)) ([6748ee1](https://github.com/galaxyproject/brc-analytics/commit/6748ee190666fde50fd2b55d8984d841efd49c2c))
* update titles on assembly detail page ([#221](https://github.com/galaxyproject/brc-analytics/issues/221)) ([#223](https://github.com/galaxyproject/brc-analytics/issues/223)) ([076a09b](https://github.com/galaxyproject/brc-analytics/commit/076a09b8a7ee8bb9a5bc759160c0c682638f7bdc))

## [0.1.0](https://github.com/galaxyproject/brc-analytics/compare/v0.0.0...v0.1.0) (2025-01-18)


### Features

* add script to get organisms and genomes from ncbi api ([#159](https://github.com/galaxyproject/brc-analytics/issues/159)) ([#160](https://github.com/galaxyproject/brc-analytics/issues/160)) ([61413a2](https://github.com/galaxyproject/brc-analytics/commit/61413a2137555e157b5df878bf4111c19a0a944e))
* add version info to footer ([#166](https://github.com/galaxyproject/brc-analytics/issues/166)) ([#185](https://github.com/galaxyproject/brc-analytics/issues/185)) ([3fbb881](https://github.com/galaxyproject/brc-analytics/commit/3fbb8817fc9ceece765e9b445294f52f3fc9e298))
* added discourse header/footer button ([#88](https://github.com/galaxyproject/brc-analytics/issues/88)) ([#180](https://github.com/galaxyproject/brc-analytics/issues/180)) ([c12414e](https://github.com/galaxyproject/brc-analytics/commit/c12414ec4ff7571016a5f06f4407059c045a682e))
* added links to footer ([#174](https://github.com/galaxyproject/brc-analytics/issues/174)) ([#181](https://github.com/galaxyproject/brc-analytics/issues/181)) ([86c7c93](https://github.com/galaxyproject/brc-analytics/commit/86c7c9314b203790bf6f22de685224bf99480abc))
* build data from ncbi and add organisms with assembly lists ([#208](https://github.com/galaxyproject/brc-analytics/issues/208)) ([#209](https://github.com/galaxyproject/brc-analytics/issues/209)) ([0947c6d](https://github.com/galaxyproject/brc-analytics/commit/0947c6d477b38381129f03c8e1d19be2295c23d7))
* build source data starting from accessions ([#210](https://github.com/galaxyproject/brc-analytics/issues/210)) ([#211](https://github.com/galaxyproject/brc-analytics/issues/211)) ([56938c7](https://github.com/galaxyproject/brc-analytics/commit/56938c7e63ff05b648cf8d398ae54ea129f71b05))


### Bug Fixes

* append newline before other content in `set-version.sh` ([#184](https://github.com/galaxyproject/brc-analytics/issues/184)) ([#186](https://github.com/galaxyproject/brc-analytics/issues/186)) ([4d80b82](https://github.com/galaxyproject/brc-analytics/commit/4d80b8230d8ba397df520c4419a2bf55c8803b4c))


### Chores

* add `content` commit type to commitlint config ([#169](https://github.com/galaxyproject/brc-analytics/issues/169)) ([#172](https://github.com/galaxyproject/brc-analytics/issues/172)) ([0f8bea0](https://github.com/galaxyproject/brc-analytics/commit/0f8bea063981ecc0e2d2833c52ada6941542d397))
* update dev dependancies ([#199](https://github.com/galaxyproject/brc-analytics/issues/199)) ([a74e1fe](https://github.com/galaxyproject/brc-analytics/commit/a74e1fed61f7a8f797645d72579da5b2c2fec099))
* upgrade findable and allow toggling all columns ([#203](https://github.com/galaxyproject/brc-analytics/issues/203), [#204](https://github.com/galaxyproject/brc-analytics/issues/204)) ([#205](https://github.com/galaxyproject/brc-analytics/issues/205)) ([f4bdff4](https://github.com/galaxyproject/brc-analytics/commit/f4bdff49e6f2d822ccc334ab40657a68d778f4d4))
* upgrade findable-ui to 15.0.0 ([#167](https://github.com/galaxyproject/brc-analytics/issues/167)) ([#182](https://github.com/galaxyproject/brc-analytics/issues/182)) ([cae8fd7](https://github.com/galaxyproject/brc-analytics/commit/cae8fd70c8d1a27d2a7e888885fca8b8e0bd8ff1))


### Content

* removed galaxy academy card ([#189](https://github.com/galaxyproject/brc-analytics/issues/189)) ([#193](https://github.com/galaxyproject/brc-analytics/issues/193)) ([d113aad](https://github.com/galaxyproject/brc-analytics/commit/d113aad40e8499aa85bd5ab794f4161c98050dc4))
* update carousel card regarding 2024-10-30 webinar ([#176](https://github.com/galaxyproject/brc-analytics/issues/176)) ([#179](https://github.com/galaxyproject/brc-analytics/issues/179)) ([3837601](https://github.com/galaxyproject/brc-analytics/commit/38376011b271062cd3d3a5db9d4970e05e0fbb6a))


### Build System

* checkout tags during build to show in footer ([#215](https://github.com/galaxyproject/brc-analytics/issues/215)) ([#216](https://github.com/galaxyproject/brc-analytics/issues/216)) ([37962f4](https://github.com/galaxyproject/brc-analytics/commit/37962f4ddf6c12366637314c3ab764ffef76c1c0))
