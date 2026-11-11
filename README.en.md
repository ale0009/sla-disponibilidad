# How long can your service be down?

[Español](README.md) · **English**

A page that does one thing: it turns an **SLA** (service level agreement) into real time and checks whether your architecture can meet it. The interface is in Spanish.

- **Error budget:** type 99 %, 99.9 %, 99.95 %… and see how much downtime is allowed per day, week, month and year. Supports **24×7** or **5×8** service hours and **excluded maintenance** windows (and shows what users actually experience).
- **Architecture builder:** components in **series** (all required: multiply) with **parallel replicas** (1 − (1 − A)ⁿ). Shows total availability, whether it meets the SLA, the **weakest link**, its share of downtime and how much one more copy helps. Examples: an online store and the class case (a bug-reporting system for a video game company).
- **MTBF / MTTR:** A = MTBF / (MTBF + MTTR) and the maximum MTTR to meet the SLA.
- **SLA, OLA and UC** (ITIL 4) in three lines.
- `/proceso/`: the class case, the formulas, why "the nines" mislead, the series trap (with charts), limitations, errata and sources.

Everything runs in the browser; no API, no server. Reference: 99.9 % 24×7 allows **8 h 45 min 36 s** per year (365-day year).

## Usage

```bash
python3 -m http.server 8000   # then open http://localhost:8000
node --test                   # 20 tests (Node 20+)
```

## Limitations

Assumes **independent** failures. Measures uptime, not latency or partial errors. Component percentages in the examples are assumptions, not published vendor SLAs.

## Origin

An ITIL 4 class project: service design of a bug-reporting system for a video game company, with its SLA and OLA. The SLA promised 99.9 % 24/7 without translating it into minutes or checking the architecture; this tool does both.

## Credits

[Mario Puerta «ale0009»](https://github.com/ale0009) × [David Rincón «Kuronoma»](https://www.linkedin.com/in/davidalexanderrinconcorredorkuronoma/). MIT License.
