# Fiber basic CRUD

Created: January 14, 2025 6:01 PM
Owner: Din Lester
Tags: api, go
Status: Upcoming
Last edited time: January 15, 2025 6:30 PM

https://docs.gofiber.io/

https://gorm.io/

https://go.dev/

Find example of CRUD app on github: `knwoledge_sharing/programming/go/crud_fiber`

TESTS:

- FastAPI + uvicorn

```python
Running 30s test @ http://localhost:3000/api/v1/notes
  4 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    23.15ms   10.87ms 161.18ms   74.98%
    Req/Sec     1.10k   181.14     1.68k    70.25%
  132104 requests in 30.05s, 21.29MB read
Requests/sec:   4395.64
Transfer/sec:    725.45KB
```

**WITHOUT DB SIMPLE HEALTHCHECK**

```python
Running 30s test @ http://localhost:3000/
  4 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    14.66ms    7.61ms 100.71ms   69.74%
    Req/Sec     1.74k   387.89     2.68k    62.58%
  207580 requests in 30.06s, 27.71MB read
Requests/sec:   6904.51
Transfer/sec:      0.92MB

```

- Fiber (12 procs)

```python
Running 30s test @ http://localhost:3000/api/v1/notes
  4 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    31.74ms   38.12ms 301.76ms   82.88%
    Req/Sec     1.40k   434.80     3.40k    69.26%
  167111 requests in 30.09s, 51.64MB read
Requests/sec:   5552.86
Transfer/sec:      1.72MB
```

**WITHOUT DB SIMPLE HEALTHCHECK**

```python
Running 30s test @ http://localhost:3000/
  4 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     3.25ms    4.61ms  47.18ms   85.56%
    Req/Sec    17.92k     2.94k   25.63k    71.42%
  2140484 requests in 30.02s, 330.69MB read
Requests/sec:  71309.13
Transfer/sec:     11.02MB
```

**ChatGPT analysis for test with DB**

Порівняння метрик продуктивності

| **Метрика** | **FastAPI** | **Fiber** | **Коментарі** |
| --- | --- | --- | --- |
| Середня затримка | 23.15мс | 31.74мс | FastAPI демонструє нижчу середню затримку. |
| Стандартне відхилення затримки | 10.87мс | 38.12мс | FastAPI має більш стабільну затримку. |
| Максимальна затримка | 161.18мс | 301.76мс | FastAPI має нижчу пікову затримку. |
| Запитів/сек | 4395.64 | 5552.86 | Fiber обробляє більше запитів на секунду. |
| Загальна кількість запитів | 132,104 | 167,111 | Fiber обробив більше запитів за 30 секунд. |
| Передача даних/сек | 725.45КБ | 1.72МБ | Fiber передає значно більше даних. |

### Висновки

**Пропускна здатність:**

Fiber перевершив FastAPI за пропускною здатністю — 5552.86 запитів/сек проти 4395.64 запитів/сек. Це свідчить, що Fiber може обробляти більший потік запитів.

**Затримка:**

FastAPI досягнув нижчої середньої затримки (23.15мс) порівняно з Fiber (31.74мс).

FastAPI також демонструє більш стабільну затримку (нижче стандартне відхилення) і меншу максимальну затримку, тобто більш послідовно обробляє запити.

**Використання ресурсів:**

Fiber, ймовірно, використовує переваги легковагих горутин Go та ефективної моделі конкурентності, що робить його придатним для сценаріїв із високим навантаженням.

FastAPI, побудований на Python та Uvicorn, балансує між швидкістю та надійністю, але дещо обмежений глобальною блокуванням інтерпретатора Python (GIL) і можливостями багатопотоковості.

**Швидкість передачі даних:**

Fiber продемонстрував значно вищу швидкість передачі даних (1.72МБ/сек) порівняно з FastAPI (725.45КБ/сек). Це може вказувати на те, що Fiber більш ефективний у обробці та передачі великих обсягів даних.

**ChatGPT analysis for test without DB**

### Порівняння метрик продуктивності

| **Метрика** | **FastAPI** | **Fiber** | **Коментарі** |
| --- | --- | --- | --- |
| Середня затримка | 14.66мс | 3.25мс | Fiber забезпечує значно нижчу затримку. |
| Стандартне відхилення затримки | 7.61мс | 4.61мс | Fiber має менше коливань у часі відгуку. |
| Максимальна затримка | 100.71мс | 47.18мс | Fiber демонструє меншу пікову затримку. |
| Запитів/сек | 6904.51 | 71,309.13 | Fiber обробляє у 10 разів більше запитів на секунду. |
| Загальна кількість запитів | 207,580 | 2,140,484 | Fiber обробляє значно більший трафік. |
| Передача даних/сек | 0.92МБ | 11.02МБ | Fiber передає у 11 разів більше даних за секунду. |

### Ключові спостереження

**Пропускна здатність:**

Fiber досягає величезної пропускної здатності — 71,309 запитів/сек проти 6,904 запитів/сек у FastAPI.

Ця різниця підкреслює ефективну модель конкурентності в Go (горутини), яка перевершує асинхронну обробку запитів у FastAPI, обмежену глобальним блокуванням інтерпретатора Python (GIL).

**Затримка:**

Fiber демонструє значно нижчу середню затримку (3.25мс проти 14.66мс) і меншу максимальну затримку.

Це означає, що Fiber швидше відповідає на окремі запити навіть за високого навантаження.

**Стабільність:**

Хоча у Fiber трохи більший відсоток запитів із затримкою, що перевищує 1 стандартне відхилення від середнього (85.56% проти 69.74%), абсолютне відхилення менше. Це свідчить, що час відгуку Fiber є більш стабільним, ніж у FastAPI.

**Ефективність:**

Швидкість передачі даних у Fiber (11.02МБ/сек) значно перевищує FastAPI (0.92МБ/сек), що вказує на його переваги у обробці та передачі навіть простих JSON-відповідей.

![image.png](Fiber%20basic%20CRUD%20142a7bfef8d447e5864506cb69e4e2f8/image.png)

![image.png](Fiber%20basic%20CRUD%20142a7bfef8d447e5864506cb69e4e2f8/image%201.png)

![image.png](Fiber%20basic%20CRUD%20142a7bfef8d447e5864506cb69e4e2f8/image%202.png)