**Metabase** is an open-source BI tool that is written in TypeScript and Clojure. [Why?](https://medium.com/@metabase/why-we-picked-clojure-448bf759dc83). It was originally written in Django but they faced few problems:
1. WSGI’s request model didn’t match their need (whatever that means)
2. Python’s Mysql and Postgres database drivers required compilation
3. Complicated set-up: Docker + nginx + uWSGI + Django + compiled drivers + search indexing (whoosh) processes + Celeryd + Celery workers + Redis

After that they started to look into other programming languages, including Scala, Go, and Python but using other web servers. They tried Scala, but it was a hard time to port their custom query language system to Scala, so they decided to use Clojure.
# Data Sources
[Not much](https://www.metabase.com/data-sources/). Only 28 different connectors with no connection to REST API.
But it can be an interesting use-case for [PostgREST](https://docs.postgrest.org/en/v12/). In theory, you don't need to write custom ETL pipeline to store your data to visualize it, but you can set up PostgREST to pull it for you for further visualization. Also I'm wondering if you can use Postgres integrations with other DBs as a workaround to connect to DB that is not in list of available Metabase data sources. Postgres-proxy for everything?

# Lets run it
Since Metabase is written in Clojure and uses Java-based embedded database H2 (kind of SQLight but written in Java) entire Metabase code can be compressed into one JAR file, so you can run it wherever you have Java. [Here is the guide](https://www.metabase.com/docs/latest/installation-and-operation/running-the-metabase-jar-file). The size of this JAR is around 0.5 Gib.

But to make it easier to you I will use [Docker setup](https://www.metabase.com/docs/latest/installation-and-operation/running-metabase-on-docker). 
```bash
docker pull metabase/metabase:latest
docker run -d -p 3000:3000 --name metabase metabase/metabase
```

After running the docker let's go to http://localhost:3000 to look through the UI. 
First thing that I've notices that it is in Ukrainian from the box! It has [30+  different languages](https://www.metabase.com/docs/latest/configuring-metabase/localization) and Ukrainian has [100% coverage with 47% approval](https://crowdin.com/project/metabase-i18n). Let's use Ukrainian because I'm curious about the translation quality.

I like default values on initial admin set-up page
![[Pasted image 20250429111146.png|500]]

As I said, there are not so many datasources and I'm too lazy to set up postgres for my test data, so let's try to install community-driven connector for DuckDB 🐤
![[Pasted image 20250429111547.png|500]]

To do this we need to go to the list of [community drivers](https://www.metabase.com/docs/v0.54/developers-guide/community-drivers), find DuckDB and download JAR file from the [latest release](https://github.com/motherduckdb/metabase_duckdb_driver/releases) and after that add it to plugins folder inside Metabase:
```bash
❯ docker cp Downloads/duckdb.metabase-driver.jar metabase:./plugins/
```

Після цього одразу підемо в Адмін панель -> Локалізація і поставимо православні 24-годинний час а також понеділок як початок тижня. Раз ми вже тут, то можемо пробігтися по налаштуванням 
\* Пробігається по налаштуванням *
Вони переклали Slack як Слабкий і я це [виправив тут](https://crowdin.com/editor/metabase-i18n/2/en-uk?view=comfortable&filter=basic&value=0&search_scope=everything&search_strict=0&search_full_match=0&case_sensitive=0#q=%D1%81%D0%BB%D0%B0%D0%B1%D0%BA%D0%B8%D0%B9) 

Я запустив невеличкий скрипт щоб завантажити дані в нашу базу (скрипт лежить в репозиторії). Оскільки я забув замаунтити папку до докер контейнера я просто скопіюю усю базу (це один файл, як зручно, господь бережи Duck DB) в контейнер вручну
```bash
docker cp /Users/apple/IdeaProjects/Knowledge-sharing/tools/bi/Metabase/metabase.duckdb metabase:./data/
```

Але... на етапі підключення до бази я отримав помилку `Could not initialize class org.duckdb.DuckDBNative` . [Ось тут](https://github.com/AlexR2D2/metabase_duckdb_driver/issues/1) розробники пишуть, що там проблема з дистрибутивами і версіями лінукса, тому вони радять зробити свій докер файл з іншою лінухою. Оскільки Metabase йде у формі одного JAR файлу, то докерфайл вийшов буквально на 6 рядків. [Інструкція](https://github.com/AlexR2D2/metabase_duckdb_driver/issues/29) (не забудьте поміняти URL на новішу версію релізу).

До речі, я знайшов [ось цей тред](https://github.com/AlexR2D2/metabase_duckdb_driver/issues/29) де компанія MotherDuck (творці DuckDB) взяли на себе підтримку цього драйвера. Просто цікавий факт.

Після перестворення докер контейнеру пробуємо все налаштувати, приконектитись знову і... воно працює🎉!

\* показати як створюється конекшин до бази на прикладі Кря2 *

# Data exploration
На головній сторінці ми можемо побачити прикольну фішку Metabase - [X-Ray](https://www.metabase.com/glossary/x-ray) . Metabase побудує аналітику за вас. Дуже зручно, бо я взагалі не дивився в ці дані, а натиснувши одну кнопку я вже можу побачити хоч якусь інформацію. Дуже зручно як перший крок в аналітиці.

\* проклікати X-Ray *

\* Клікнути на **Новий**  в верхньому правому куті і показати Запит та SQL-запит*

\* Створити дашборд на основі X-Ray для таблиці Spells *

\*  Показати як я створював графіки, показати як я довго думав над графіком по класам *

# What I liked
1. Easy to run
2. Looks nice and minimal
3. You don't need any specialized language to work with it, just use SQL!
4. You can make things done pretty fast
5. You can use Metabase embeddings to show dashboards on your website
# What I didn't like
1. You cannot add custom charts and default library of charts is pretty small ([GitHub issue](https://github.com/metabase/metabase/issues/2318) is open for 9 years!)
2. A lot of stuff is under Pro version only including coloring/appearance
3. No count number in the default table
4. Not so many connectors

# Summary

Мені важко придумати ситуацію, в якій я би використовував Metabase. Для маленьких проєктів можна і просто графіки за допомогою plotly/matplotlib в гугл колабі малювати і через гугл диск шарити, а для більших Metabase може бути недостатньо. Але можливо десь там існує золота середина для Metabase.
Порівнюючи з Superset, то Metabase виглядає краще, новіше і його легше розгортати, але при цьому в ньому на порядок менше можливостей, в тому числі і візуалізацій. 

# Sources
1. Metabase website https://www.metabase.com/
2. Metabase GitHub https://github.com/metabase/metabase
3. Metabase blog with different "best practises" https://www.metabase.com/blog
4. Dashboard exmples:
	1. UNESCO dashboard that is using Metabase embedding on the site https://www.unesco.org/en/safety-journalists/observatory/statistics?hub=72609
	2. More examples https://www.metabase.com/examples
5. Getting started course from Metabase https://www.metabase.com/learn/metabase-basics/getting-started/
6. Data:
	1. DnD https://github.com/rfordatascience/tidytuesday/blob/main/data/2024/2024-12-17/readme.md
	2. Penguins https://github.com/rfordatascience/tidytuesday/blob/8ecdd1f6a62e2f3e78517cbad03899c05b4f2f1a/data/2025/2025-04-15/readme.md