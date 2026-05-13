Electrical Safety Standards
1.1 The Physics of Electricity — Voltage, Current, Resistance, and Power
Standard: This standard exists as a foundational rule because electrical safety decisions made without understanding the underlying physics are guesses — sometimes correct, sometimes catastrophically wrong. A community member who understands Ohm's Law and its implications can evaluate any electrical situation, including improvised systems and salvaged components that no standard directly addresses. A community member who knows only rules without physics cannot adapt when the situation doesn't match the rule.
The four fundamental quantities:
Voltage (V) — the pressure:

Voltage is the electrical potential difference between two points — the force that drives current through a conductor
Measured in volts (V)
Common voltages in community electrical systems:

12V DC: single battery, small solar systems, automotive systems
24V DC: medium solar and battery systems, improved efficiency over 12V
48V DC: large battery banks, most efficient common DC voltage for community-scale systems
120V AC: standard North American household voltage
240V AC: high-power appliances in North America, standard household voltage in much of the world
277V AC and above: commercial and industrial, not relevant to community systems


Voltage alone does not determine hazard — a 12V battery bank can deliver lethal current. A 50,000V static discharge is usually harmless

Current (A) — the flow:

Current is the rate of flow of electrical charge through a conductor
Measured in amperes (amps, A)
Current is what kills — the physiological effects of electricity are determined by current through the body, not voltage
Current through the human body:

1 milliamp (mA): barely perceptible tingle
5 mA: painful shock
10-20 mA: muscular paralysis — cannot release grip, cannot pull away from the conductor
50-100 mA: ventricular fibrillation — the heart's electrical rhythm is disrupted, causing cardiac arrest
Above 100 mA: severe burns, cardiac arrest, death without immediate intervention


The current that flows through the body depends on both the voltage and the body's electrical resistance

Resistance (Ω) — the opposition:

Resistance is the opposition to current flow in a conductor
Measured in ohms (Ω)
Every conductor has resistance — even copper wire has resistance, though very low
Human body resistance varies significantly:

Dry skin: 10,000-100,000 Ω — relatively high resistance limits current at moderate voltages
Wet skin: 1,000-10,000 Ω — dramatically lower, allowing much higher current at the same voltage
Internal body: 300-1,000 Ω — the resistance once skin barrier is penetrated by a wound or puncture


This is why wet conditions are so dangerous — the body's primary resistance barrier (dry skin) is eliminated

Ohm's Law — the fundamental relationship:

Current = Voltage ÷ Resistance (I = V/R)
This single equation explains most electrical hazards:

Higher voltage → higher current at equivalent resistance → more dangerous
Lower resistance (wet skin) → higher current at equivalent voltage → more dangerous
Higher resistance (insulating gloves, dry conditions) → lower current → less dangerous


Practical application: a person with wet hands touching a 120V circuit has body resistance of approximately 2,000 Ω. Current = 120 ÷ 2,000 = 0.06 A = 60 mA — well above the ventricular fibrillation threshold. The same person with dry hands (50,000 Ω resistance) experiences 120 ÷ 50,000 = 2.4 mA — uncomfortable but not lethal. Same voltage, same circuit, dramatically different outcome based solely on skin resistance

Power (W) — the rate of energy delivery:

Power is the rate at which electrical energy is converted to heat, light, or mechanical work
Power = Voltage × Current (P = V × I)
Measured in watts (W) or kilowatts (kW)
Power in conductors is converted to heat — this is both useful (in heaters and toasters) and dangerous (in overloaded wiring)
The heat produced in a conductor: P = I² × R — the heat is proportional to the square of the current. Double the current, quadruple the heat. This is why overcurrent protection is critical — small increases in current produce large increases in heating in the wire

The relationship between wire size, current, and heat:

Every wire has resistance proportional to its length and inversely proportional to its cross-sectional area — thinner and longer wires have more resistance
Current flowing through wire resistance produces heat — P = I² × R
At normal design current the heat produced is small and the wire stays cool
Above the design current the heat increases with the square of the current — the wire heats progressively, the insulation softens and eventually ignites, and a fire starts in the wall where it cannot be seen or suppressed

AC versus DC:

Alternating current (AC) reverses direction 50-60 times per second — the voltage rises from zero to peak, falls back through zero, rises to negative peak, and returns to zero in each cycle
Direct current (DC) flows in one direction continuously — batteries, solar panels, and most electronic devices use DC
AC is more dangerous than DC at equivalent voltages because the alternating current interferes more severely with the heart's electrical rhythm
DC at high voltage (above 48V) is hazardous in its own right — it tends to cause sustained muscular contraction that holds the victim in contact with the conductor longer than AC, which periodically allows muscle relaxation
DC at high current — from battery banks — creates arc flash hazards during connection and disconnection that AC systems of equivalent power do not

Rationale: Ohm's Law is presented here in full because it is the single most powerful electrical safety tool available to a non-electrician — it converts qualitative hazard assessment into quantitative analysis. A community member who knows that I = V/R can calculate the current that would flow through their body in a specific situation and compare it to the physiological thresholds above. This calculation takes 30 seconds and can determine whether a situation is safe, borderline, or immediately dangerous. The rule-of-thumb approaches to electrical safety — "treat all circuits as live," "use rubber gloves," "don't work in wet conditions" — are correct but incomplete without understanding why. Ohm's Law provides the why.
The wet skin resistance reduction is emphasized because it is the most common factor that converts a non-lethal exposure into a lethal one. A 120V circuit that is survivable under dry conditions can deliver lethal current under wet conditions — the same circuit, the same voltage, but a 25-fold reduction in body resistance that pushes the current from the uncomfortable zone into the ventricular fibrillation zone. Community members working on electrical systems near water, in wet weather, or with wet hands shall understand that they are operating with dramatically reduced resistance — and therefore dramatically increased hazard — compared to dry conditions.
The I² × R heating relationship is included because it explains why wire sizing matters in a way that no rule can fully convey. Double the current in a wire, quadruple the heat. A wire carrying 150% of its rated current is producing 225% of its rated heat — heat that the wire's insulation was not designed to dissipate. The insulation softens, the conductor-to-conductor or conductor-to-ground resistance drops, arcing begins, and a fire starts inside the wall where it is invisible until it has spread substantially. This is not a failure mode that happens suddenly — it happens progressively over minutes to hours of overload, during which the wire and its surroundings are heating toward ignition without any visible warning. The overcurrent protection that interrupts the circuit before this heating progression is complete is the only reliable protection.

1.2 How Electricity Kills and Injures — Physiological Mechanisms
Standard: Understanding the physiological mechanisms of electrical injury allows community members to make accurate assessments of electrical hazard severity, to respond correctly to electrical injury events, and to understand why electrical safety practices that appear conservative are actually calibrated to genuine physiological thresholds.
The four mechanisms of electrical injury:
Ventricular fibrillation:

The most common cause of death from electrical shock
The heart's pumping rhythm is controlled by an electrical impulse that spreads through heart muscle in a precise pattern
External electrical current disrupting this pattern causes the heart muscle fibers to contract independently and randomly — fibrillation — rather than in coordinated pumping action
Fibrillating heart pumps no blood — death from oxygen deprivation occurs within minutes without intervention
The current threshold for ventricular fibrillation: approximately 50-100 mA for AC, 300-500 mA for DC (AC is significantly more likely to cause fibrillation at equivalent currents)
The current path through the body determines whether the heart is in the current path — hand-to-hand current paths (both hands on the circuit) pass directly through the heart. Hand-to-foot paths also pass through the heart. Foot-to-foot paths may bypass the heart entirely
Cardiac defibrillation — applying a controlled shock to reset the heart's electrical rhythm — is the specific treatment for ventricular fibrillation. Without defibrillation, survival from fibrillation is unlikely beyond 5-10 minutes

Respiratory arrest:

Electrical current through the chest wall causes the respiratory muscles to contract and prevents inhalation
Victims in contact with an energized conductor may stop breathing before cardiac arrest occurs
Removal from the electrical source allows spontaneous breathing to resume if cardiac function is intact
Artificial respiration (rescue breathing) maintains oxygenation until normal breathing resumes

Burns:

Electrical burns occur at the entry and exit points of current through the body — the areas of highest current density and therefore highest heating
The entry wound is typically small and charred — the exit wound is typically larger and more extensively damaged
Internal burns along the current path are not visible externally but may be severe — current passing through muscle, nerve, and internal organs produces heating and tissue destruction throughout the current path
Arc flash burns — from the radiant heat and pressure wave of an electrical arc — are external burns that may affect large body surface areas and eyes without the victim being in the electrical circuit

Fall and blast injuries:

The muscular contraction caused by electrical shock may cause falls — a person working at height who receives a shock may fall regardless of whether the electrical injury itself is severe
The blast pressure wave from arc flash can throw a person across the room
These secondary injuries may be more immediately threatening than the electrical injury itself

Special considerations:
The "can't let go" phenomenon:

At currents above 10-20 mA, the flexor muscles of the hand and forearm contract more strongly than the extensor muscles — the hand grips the conductor involuntarily and cannot release it
A person who cannot release their grip remains in contact with the conductor until the circuit is broken or they lose consciousness
Never grab a person who is in contact with an energized conductor — the rescuer becomes part of the circuit. Break the circuit first (turn off power, use a non-conductor to move the victim away from the source)

Delayed effects:

A person who survives electrical shock may develop cardiac arrhythmias, renal failure (from destruction of muscle proteins released into the bloodstream), and neurological effects in the hours and days following the event
Any person who has received a significant electrical shock shall be evaluated by the community medical officer regardless of apparent immediate recovery

Lightning:

Lightning is a high-voltage, high-current, extremely brief DC discharge
Lightning kills primarily through cardiac arrest — the current through the heart is massive but brief, often allowing spontaneous recovery with early CPR
Lightning survivors have high rates of neurological damage including personality changes, memory impairment, and chronic pain

Response to electrical shock — the correct sequence:

Do not touch the victim until the electrical source is disconnected — turn off power at the source (breaker, switch, disconnect) or use a non-conductive object (dry wood, rubber) to move the victim away from the conductor
Once separated from the source: assess consciousness and breathing
If unconscious and not breathing: begin CPR immediately. The most common reversible cause of electrical death is ventricular fibrillation or respiratory arrest — CPR maintains circulation and oxygenation until the heart restores normal rhythm or defibrillation is available
Treat for shock — keep the victim warm, horizontal, and calm
Evaluate for burns — entry and exit wounds, arc flash burns
Transport to medical evaluation even if the victim appears fully recovered

Rationale: The cannot-release-grip mechanism is included as a mandatory standard because the most dangerous instinctive response to finding someone in contact with an energized conductor — grabbing them to pull them away — makes the rescuer part of the circuit. This instinct kills rescuers. The correct response — break the circuit before touching the victim — is counterintuitive because it feels like delay when speed seems essential. Understanding why the sequence is correct (rescuer cannot help victim if rescuer is also electrocuted) provides the rationale that makes the counterintuitive correct behavior sustainable under stress.
The delayed effects standard is included because electrical injury has a distinct deceptive presentation — a person who walks away from an electrical shock appearing uninjured may develop life-threatening cardiac arrhythmia or renal failure hours later. The internal burns from current passing through muscle tissue release myoglobin — the oxygen-carrying protein in muscle — into the bloodstream. Myoglobin filtered through the kidneys at high concentrations causes renal tubular obstruction and acute renal failure. This delayed presentation means that apparent immediate recovery does not indicate safety from subsequent injury. Medical evaluation after any significant electrical shock is not precautionary overcaution — it is appropriate response to a known delayed injury mechanism.

1.3 How Electrical Fires Start — The Three Ignition Mechanisms
Standard: Electrical fires are the leading cause of structure fires in communities with electrical infrastructure. Understanding the three ignition mechanisms — resistance heating, arcing, and sparking — allows community members to identify electrical conditions likely to cause fires before ignition occurs. In a degraded infrastructure context where improvised wiring and overloaded circuits are common, this knowledge is directly lifesaving.
Mechanism 1 — Resistance heating (I²R heating):

Every conductor has resistance. Current flowing through resistance produces heat — P = I²R
At design current levels, the heat produced is small and is safely dissipated through the wire insulation and surrounding materials
Above design current levels, heat increases with the square of the current — a conductor carrying 150% of its rated current produces 225% of its rated heat
When the heat produced exceeds what can be dissipated, the conductor temperature rises progressively
The sequence: wire heats → insulation softens → insulation melts → bare conductors contact each other or combustible materials → ignition

The insidious nature of resistance heating:

This failure mode develops over minutes to hours — not instantly
The wire is inside a wall or ceiling where it cannot be observed
There is no visible warning until the surrounding material ignites
The ignition point is inside the wall — the fire is established before it becomes visible
By the time smoke is detected from a resistance-heating fire the fire may already be substantial

Causes of overload leading to resistance heating:

Too many loads on a single circuit — adding appliances beyond the circuit's capacity
Extension cords used as permanent wiring — extension cords are not rated for the continuous high current of permanent wiring applications
Undersized wire for the load — wiring a circuit with wire too thin for the current it will carry
Poor connections that add resistance locally — a loose connection has higher resistance than a tight connection, concentrating heat at the connection point

Mechanism 2 — Arcing:

An arc is an electrical discharge through air between two conductors with a voltage difference between them
Arcs occur at: loose connections where conductors intermittently contact each other, damaged insulation where conductors are exposed, connectors that are partially inserted, and during switching operations
Arc temperature: 6,000-20,000°F — the arc itself is far above the ignition temperature of any building material
Even brief arcing can ignite combustible materials — a single arc lasting a fraction of a second can ignite sawdust, insulation, or dried wood

Types of arcing:

Series arcing: occurs in a broken conductor where current continues to flow across the gap — a frayed wire where the strands intermittently contact across the break
Parallel arcing: occurs between two conductors at different potentials — a damaged wire where the hot conductor contacts the neutral or ground conductor, or contacts a grounded metal surface
Ground fault arcing: a conductor touching a grounded surface — the arc between the conductor and ground. Ground fault circuit interrupters (GFCIs) detect this condition and interrupt the circuit before sustained arcing occurs

Arc flash:

A high-energy arc flash — distinct from the small arcs in household wiring — is a rapid release of electrical energy that produces an intense pressure wave, a blast of molten metal, and intense radiant heat
Arc flash occurs when high-capacity circuits are disconnected or shorted — battery bank terminals, large inverter connections, and high-current bus connections are the primary arc flash hazard in community electrical systems
The radiant heat from an arc flash can cause severe burns at distances of several feet
Arc flash is the most underestimated electrical hazard in community solar and battery systems — a large battery bank can deliver enormous current into a fault, producing an arc flash of sufficient energy to cause serious injury

Mechanism 3 — Sparking:

Sparking is the production of small electrical discharges — distinct from sustained arcing
Sparking occurs during: switching operations (the moment a switch opens or closes, a small spark occurs), motor starting (the brushes in DC motors produce sparks during commutation), static discharge
Most sparking is brief and low-energy — it does not produce sustained ignition in normal environments
Sparking becomes an ignition hazard in the presence of flammable vapors — gasoline vapor, hydrogen gas from charging lead-acid batteries, propane leak. A small spark in a flammable atmosphere produces an explosion

The flammable atmosphere hazard:

Lead-acid batteries produce hydrogen gas during charging — hydrogen is flammable at concentrations as low as 4% in air
Gasoline and propane have even lower flammable limits
Any electrical equipment — switches, connections, motors — in a space containing flammable vapor is a potential ignition source
Battery charging areas shall be ventilated per the standards in Section 1.8 — hydrogen accumulation in an enclosed space creates an explosion hazard

Rationale: The resistance heating insidious progression is described in detail because it is the fire cause most consistently misunderstood by non-electricians. People associate electrical fires with dramatic events — sparks, arcing, visible damage. The resistance-heating fire provides none of these visible warnings. It begins silently inside a wall, progresses over minutes to hours, and announces itself only when smoke or flame emerges from the wall surface — by which point the fire is established inside the wall cavity where it is difficult to suppress. A community that understands this mechanism understands why wire sizing and overcurrent protection are not bureaucratic requirements — they are the only protection against a failure mode that has no other visible warning system.
The arc flash warning for battery systems is included with particular emphasis because it is the hazard most consistently underestimated by community members building solar and battery systems. Battery banks capable of delivering thousands of amperes into a fault — common in community-scale energy storage systems — can produce arc flash events of far greater energy than household wiring systems. The energy released in an arc flash is proportional to the available fault current — and a large lithium battery bank has essentially unlimited fault current available at its terminals. The protective equipment and work practices required for safe work on large battery systems are qualitatively different from those required for household wiring. This distinction is detailed in Section 1.9.

1.4 Wire Sizing — Matching Wire to Load
Standard: Wire sizing is the most fundamental electrical installation decision — a wire too small for the current it carries will heat and eventually cause a fire. Wire sizing shall match the wire's current-carrying capacity to the actual current it will carry, with appropriate safety margins. This standard provides practical wire sizing guidance for the range of conductors likely to be available in community electrical systems including salvaged wire.
Wire sizing fundamentals:
Wire gauge systems:

American Wire Gauge (AWG): the standard in North America — lower numbers indicate larger wire. 14 AWG is smaller than 10 AWG
Metric system: cross-sectional area in square millimeters (mm²) — larger numbers indicate larger wire. 2.5 mm² is larger than 1.5 mm²
International wiring uses metric cross-sections. Salvaged wire may be labeled in either system

AWG to metric conversion for common sizes:

14 AWG ≈ 2.5 mm²
12 AWG ≈ 4 mm²
10 AWG ≈ 6 mm²
8 AWG ≈ 10 mm²
6 AWG ≈ 16 mm²
4 AWG ≈ 25 mm²
2 AWG ≈ 35 mm²
1/0 AWG ≈ 50 mm²
4/0 AWG ≈ 95 mm²

Current-carrying capacity (ampacity) for common wire sizes:
These values are for copper wire in conduit or cable at 60°C insulation rating — the most common insulation type in salvaged wire. Reduce by 20% for wire bundled with other wires (heat from adjacent wires reduces capacity). Reduce by 20% for wire in hot environments (above 86°F ambient).
AWGmm²Ampacity142.515A12420A10630A81040A61655A42570A23595A1/050125A2/070145A4/095195A
Determining wire size — the calculation:

Determine the maximum current the wire will carry — this is the load current, not the breaker size
Apply a safety factor — size the wire for 125% of the maximum continuous load. A circuit that will carry 16A continuously requires wire rated for at least 20A
Check the voltage drop — long wire runs lose voltage along the wire. Wire may need to be larger than the ampacity requires to maintain adequate voltage at the load end

Voltage drop calculation:

Voltage drop = Current × Wire Resistance × 2 (the 2 accounts for both the hot and return conductors)
Wire resistance per 1000 feet: 14 AWG = 3.1 Ω, 12 AWG = 2.0 Ω, 10 AWG = 1.2 Ω, 8 AWG = 0.76 Ω
Acceptable voltage drop: maximum 3% for lighting circuits, 5% for appliance circuits
Example: a 12V DC circuit carrying 10A over 50 feet (100 feet of wire for hot and return) with 10 AWG wire: voltage drop = 10A × (1.2 Ω/1000 ft × 100 ft) = 10 × 0.12 = 1.2V. As a percentage: 1.2/12 = 10% — too high. Would need to use 4 AWG or larger wire to keep voltage drop below 5%
Voltage drop is the primary wire sizing concern for DC systems at low voltage — 12V and 24V systems lose a significant percentage of their voltage over long runs

Identifying salvaged wire:

Salvaged wire must be evaluated before use — unknown wire of uncertain size, age, and insulation condition
Diameter measurement: measure the bare conductor diameter with calipers or by comparison to a known wire. Copper conductor diameter: 14 AWG = 0.064 inches (1.63 mm), 12 AWG = 0.081 inches (2.05 mm), 10 AWG = 0.102 inches (2.59 mm)
Insulation inspection: insulation that is brittle, cracked, or hardened has degraded and may fail under normal use. Insulation that crumbles when flexed is not safe for use. Insulation that flexes without cracking and shows no surface cracking is acceptable
Conductor inspection: copper that is significantly oxidized — dark brown or black rather than bright copper color — has increased resistance at the oxidized surfaces. Green oxidation (verdigris) on copper indicates significant corrosion. Oxidized conductors shall be cleaned at connection points before use
Aluminum wire identification: aluminum conductors are silver-colored rather than copper-colored. Aluminum wire requires different connection methods — aluminum-rated connectors only. Standard copper-rated connectors on aluminum wire cause connection failure and fire risk

Aluminum wire hazards:

Aluminum wire was used extensively in residential wiring in North America from approximately 1965-1973
Aluminum expands and contracts more than copper with temperature changes — connections loosen over time as the aluminum cycles
Loose aluminum connections overheat and are a significant fire risk
Salvaged aluminum branch circuit wire (15-20A circuits) shall not be used without aluminum-rated connections at every termination
Aluminum is acceptable for larger conductors (service entrance wire, large feeder conductors) where the connections are large enough to manage the expansion issue

Rationale: The voltage drop calculation is included in full because it is the most commonly neglected wire sizing consideration in community DC electrical systems — and the one that most directly affects system performance and safety. In AC systems at 120V or 240V, voltage drop over typical circuit lengths is small as a percentage and rarely causes significant problems. In 12V DC systems, the same absolute voltage drop is a large percentage — 1.2V lost in the wiring is 10% of the system voltage, causing lights to dim, motors to run slowly and hot, and electronic equipment to malfunction or shut down. The community that sizes its wiring for ampacity alone and ignores voltage drop builds a system that does not perform as expected and that may overheat from the additional current drawn by loads struggling to operate at reduced voltage.
The salvaged wire evaluation criteria are included because salvaged wire is the primary wiring material in degraded infrastructure contexts, and its safety varies enormously based on age, insulation type, and storage conditions. Wire insulation degrades over time — the plasticizers in PVC insulation leach out, leaving the insulation brittle and prone to cracking. A community member who knows how to evaluate salvaged wire — checking diameter, flexing insulation, inspecting for corrosion — can distinguish safely usable wire from wire that will fail in service. The brittle insulation failure mode is particularly dangerous because the wire tests electrically sound — low resistance, good continuity — but fails mechanically when installed, cracking at bends and terminations to expose bare conductor.

1.5 Connections — The Primary Electrical Failure Point
Standard: Electrical connections — the points where conductors are joined to each other, to devices, and to terminals — are the most common failure point in electrical systems. A properly sized and routed conductor that is poorly connected will overheat at the connection, arc, and eventually cause a fire or fail. Connection quality is the electrical safety standard most difficult to enforce through inspection and most dependent on installation knowledge and care.
Why connections fail:
Loose connections:

A loose connection has higher resistance than a tight connection — the contact area between the conductors is smaller, concentrating current and heat at the contact points
Loose connections heat with current flow — the heating causes thermal expansion that further loosens the connection
Progressive loosening produces progressive heating, eventually reaching ignition temperature
This failure mode is self-reinforcing — a slightly loose connection becomes progressively looser and hotter until it fails

Oxidation:

Copper oxidizes slowly — the thin oxide layer on normal copper does not significantly affect conductivity
Aluminum oxidizes rapidly and the aluminum oxide layer is an electrical insulator — it dramatically increases connection resistance
Any aluminum conductor connection shall be treated with anti-oxidant compound that prevents oxide layer formation between the conductors

Dissimilar metals:

Connecting copper and aluminum conductors directly creates a galvanic couple — the two metals react with each other in the presence of moisture, accelerating corrosion at the junction
Copper-to-aluminum connections require aluminum-rated connectors that incorporate anti-oxidant compound and control the galvanic reaction

Mechanical damage:

Conductors that are nicked, cut, or excessively compressed at connection points have reduced cross-section at those points — the current density increases and heating concentrates at the damage
Wire strippers that nick the conductor rather than cleanly stripping the insulation create damage at every connection point

Approved connection methods:
Wire nuts (twist connectors):

Appropriate for: solid and stranded conductor connections in dry locations, AC circuit connections, conductor sizes 22 AWG through 10 AWG
Installation: strip the correct length of insulation, insert conductors simultaneously and twist the connector clockwise until it is tight. Tug each conductor after installation to verify it is captured
Not appropriate for: high-current connections above 30A, wet locations without weatherproof rated connectors, aluminum conductors without aluminum-rated wire nuts
The most common installation failure: insufficient twist that allows conductors to pull free

Crimp connections:

A metal sleeve crimped mechanically around the conductors — provides a gas-tight connection that resists oxidation
Appropriate for: all conductor sizes with appropriate crimp tool and sleeve, wet and vibration environments, battery and automotive connections
Requires the correct crimp tool — hand crimping without the proper tool produces inadequate mechanical compression
The most reliable connection method for high-vibration and wet environments

Screw terminal connections:

Used at devices — outlets, switches, circuit breakers, terminal blocks
Screw torque is critical — undertorqued screws allow movement and oxidation, overtorqued screws damage conductors and terminals
Standard screw terminal torque: 12 inch-pounds for terminals rated up to 20A, 20 inch-pounds for terminals rated 20-60A
In the absence of a torque driver: tighten until firm resistance is felt, then turn an additional quarter turn — this provides approximately the correct torque for standard terminals
Stranded wire at screw terminals: stranded wire shall be tinned (dipped in solder) or terminated with a ferrule before insertion under a screw terminal. Loose strands that escape the terminal create short circuit risk

Compression lugs:

Heavy copper or aluminum sleeves compressed onto large conductors with a hydraulic or ratchet compression tool
Required for: large conductors above 2 AWG, service entrance connections, battery bank connections
The tool used for compression must match the lug — an incorrectly sized tool produces an inadequate compression that fails under load

Soldering:

Appropriate for: electronic connections, low-current signal wiring, supplementary reinforcement of mechanical connections
Not appropriate as the primary structural connection method for power wiring — solder is weak mechanically and can flow under sustained heat from an overloaded connection
Soldering to an inadequate mechanical connection — wire nut plus solder, twist plus solder — does not correct the inadequate mechanical connection

Prohibited connection methods:

Tape-wrapped twisted conductors — not a connection, a temporary contact that will fail
Wire wrapped around a screw without being captured under the screw head
Multiple conductors under a single-conductor screw terminal unless the terminal is explicitly rated for multiple conductors
Copper tape or foil as a conductor splice
Any connection that cannot be mechanically secured — conductors held in contact only by spring pressure without mechanical fastening

Junction boxes and connection protection:

Every connection shall be made in an accessible, protected location — inside a junction box, device box, or panel
Connections inside walls, above ceilings, or in other inaccessible locations are prohibited — connections that cannot be accessed cannot be inspected or repaired when they fail
Junction boxes shall be covered — an open junction box with exposed connections is a contact hazard and a fire risk from combustible materials falling onto the connections
In folk construction where electrical boxes are unavailable: connections shall be made in any non-combustible enclosure that can be accessed for inspection — a metal can, a ceramic pot, a stone enclosure. The principle is accessibility and protection from contact and combustibles

Rationale: The self-reinforcing loose connection failure mode is detailed because it explains why a connection that felt tight at installation can fail years later without any external disturbance. Thermal cycling — the expansion and contraction of conductors as they heat under load and cool when the load is removed — progressively works the conductor out from under a screw terminal or away from a wire nut thread. Each cycle moves the conductor slightly, each movement slightly increases the resistance, each resistance increase slightly increases the heating, each heating cycle slightly expands the space. The progression is slow but inevitable in a connection that is not perfectly secured. This is why connection quality at installation — correct torque, correct number of twists, correct crimp — is the primary determinant of long-term connection reliability.
The prohibition on inaccessible connections is included as an absolute standard because it is the most consistently violated connection requirement in folk electrical construction and the one with the most serious consequences. A connection made inside a wall that fails — loosens, oxidizes, begins to heat — cannot be identified or corrected. The heating continues until ignition. The fire starts inside the wall. The prohibition on inaccessible connections exists not because accessible connections cannot fail but because when they fail they can be found and fixed before ignition.

1.6 Overcurrent Protection — Fuses and Circuit Breakers
Standard: Overcurrent protection — fuses and circuit breakers — is the automatic safety system that interrupts a circuit when current exceeds safe levels, preventing the resistance heating and fire that would otherwise result from sustained overload or short circuit. Overcurrent protection is non-negotiable in all electrical systems regardless of size, voltage, or construction type. A circuit without overcurrent protection is a potential ignition source for every minute it operates.
What overcurrent protection does:

A fuse contains a metal element with a specific melting temperature — when current exceeds the fuse rating, the element heats to its melting point and opens the circuit
A circuit breaker contains a bimetal strip or electromagnetic trip mechanism — when current exceeds the rating, the mechanism trips and opens the circuit
Both devices interrupt the circuit automatically without human action — the protection operates whether or not anyone is present

The critical principle — size to the wire, not the load:
This is the most important overcurrent protection standard in this document and the most frequently violated in improvised electrical systems.
The overcurrent device protects the wire — not the load. The fuse or breaker shall be sized to the wire it protects, not to the load connected to the circuit. If the wire can safely carry 20A before overheating, the overcurrent device shall be rated at 20A regardless of whether the load only draws 5A.
Why this matters:

A 30A fuse protecting 14 AWG wire (rated 15A) allows the wire to carry 30A before the fuse blows — the wire is carrying twice its rated current and heating to potential ignition temperature, while the oversized fuse does not trip because the current has not exceeded the fuse rating
The fuse is protecting the load (the device connected to the circuit) from overcurrent — but the load can protect itself. The wire cannot protect itself — it relies entirely on the overcurrent device

Standard wire-to-overcurrent protection matching:
Wire SizeMaximum Overcurrent Protection14 AWG15A12 AWG20A10 AWG30A8 AWG40A6 AWG55A4 AWG70A
Types of overcurrent protection:
Fuses — plug type:

Glass or ceramic fuse with a metal strip — when the strip melts the circuit opens
Available in a wide range of current ratings and sizes
One-time use — must be replaced after opening
Advantages: simple, reliable, inexpensive, widely available including in automotive applications
Standard automotive blade fuses (ATO/ATC fuses) are widely available and appropriate for DC circuits up to 40A in community systems

Fuses — cartridge type:

Cylindrical metal-end fuse for higher current applications
Available in current ratings from 1A to hundreds of amps
Used in main panels, service entrance, and high-current DC applications

Circuit breakers:

Resettable — trip under overload, reset manually after the overload is corrected
Available in AC and DC ratings — AC breakers shall not be used in DC circuits above 48V without DC-rated breakers. The arc interruption mechanism differs between AC and DC — an AC breaker in a DC circuit may not interrupt the arc when it trips
Thermal-magnetic trip: a bimetal strip trips under sustained overload (thermal trip) and an electromagnetic mechanism trips under short circuit (magnetic trip)
The most common overcurrent protection in AC household circuits

Resettable fuses (PTCRs):

Polymer positive temperature coefficient resistors — increase resistance dramatically when heated by overcurrent, limiting current without interrupting it completely
Reset automatically when cooled — no replacement required
Appropriate for: low-current electronics protection, automotive accessory circuits
Not appropriate for: branch circuit protection, high-current applications

Ground fault circuit interrupters (GFCIs):

Detect current imbalance between hot and neutral conductors — any imbalance indicates current flowing through an unintended path (a person or ground fault)
Trip at approximately 5 mA of ground fault current — well below the lethal threshold
Do not protect against overload — they are in addition to, not instead of, overcurrent protection
Required at: all circuits in wet locations (bathrooms, kitchens, outdoor areas), circuits near water in community settings
Available as outlets with built-in GFCI and as breakers — either protects all outlets on the circuit

DC circuit breakers and fuses:

DC overcurrent protection requires devices specifically rated for DC service at the operating voltage
DC arcs do not self-extinguish as AC arcs do — when a circuit breaker opens a DC circuit the arc continues until the current falls below the arc sustaining threshold. A DC-rated breaker has an arc interrupting mechanism designed for this — an AC breaker does not
Battery-side fusing is the most critical DC overcurrent protection: the fuse or breaker shall be installed as close as possible to the battery bank — within 18 inches ideally. The unfused conductor between the battery and the overcurrent device is the most dangerous conductor in the system — it can deliver unlimited fault current without protection

Improvised overcurrent protection in degraded contexts:

Where commercial fuses and breakers are unavailable: a short length of appropriately sized fusible wire — wire sized to melt at the design overload current — can serve as an improvised fuse
Fusible wire sizing: copper wire of approximately 1/10 the cross-section of the protected conductor will melt at approximately the correct current
Improvised fuses shall be enclosed in a non-combustible housing — an open fusible wire is a fire hazard when it melts
Improvised fuses are a last resort — commercial overcurrent devices provide consistent, reliable protection that improvised devices cannot match

Rationale: The size-to-wire-not-load principle is the most important overcurrent protection concept in this document and the one most consistently violated in improvised electrical systems. The violation occurs because the intuitive concern is protecting the load — the appliance, the light, the motor. Protecting the wire feels secondary or unnecessary — the wire is just a conductor, not the thing that matters. The consequence of this intuition is a system where the loads are protected and the wires are not — and wires that overheat inside walls while the protected loads continue to operate normally. Commercial electrical codes universally require sizing overcurrent protection to the wire because this failure mode is so consistent and so catastrophic.
The DC breaker specification is included because the use of AC breakers in DC circuits is widespread in improvised solar and battery systems — the breakers are available, they look identical, and they fit the same panels. The distinction matters because the arc interruption mechanism is fundamentally different. An AC arc self-extinguishes 120 times per second as the AC voltage passes through zero — the arc interrupting mechanism in an AC breaker relies on this. A DC arc does not self-extinguish — once established it continues until the current falls below the arc-sustaining threshold. An AC breaker that trips in a DC circuit may not interrupt the arc — the breaker trips, the arc continues, the breaker heats to destruction, and the circuit remains energized. This failure mode has caused fires in solar installations where AC breakers were used on the DC side of the system.

1.7 Grounding and Bonding
Standard: Grounding and bonding are the most conceptually misunderstood aspects of electrical safety — they are frequently confused with each other, frequently omitted from improvised systems, and frequently installed incorrectly in ways that provide the appearance of safety without the substance. This standard clarifies what grounding and bonding accomplish and provides practical implementation guidance for community electrical systems including improvised and degraded-infrastructure systems.
The two distinct functions — grounding versus bonding:
These are different functions that are frequently confused because they share the word "ground" and are physically connected in AC systems.
Equipment grounding — protecting people:

Equipment grounding connects the metal enclosures and frames of electrical equipment to a reference point (the grounding system) so that if a live conductor contacts the enclosure, the fault current flows through the equipment ground conductor rather than through a person who touches the enclosure
Without equipment grounding: a fault inside a motor or appliance that energizes the metal case presents a lethal shock hazard to anyone who touches the case while standing on the ground
With equipment grounding: the fault current flows through the low-resistance ground conductor, trips the overcurrent protection, and the hazard is eliminated automatically
The equipment ground conductor is the green wire or bare copper wire in standard wiring — it connects every metal enclosure in the system to the grounding system

System grounding — establishing a reference:

System grounding connects one conductor of the electrical system to the earth — establishing the reference voltage from which all other voltages are measured
In a standard AC system, the neutral conductor is connected to earth at the service entrance — this establishes the neutral at earth potential (0V) and the hot conductor at 120V above earth
Without system grounding: voltage potentials in the system float relative to earth — a shock requires contact with two conductors. With system grounding: a shock can occur by contacting only the hot conductor while touching earth (standing on the ground, touching a grounded metal surface)
Paradoxically, system grounding makes the system more hazardous to someone contacting a single live conductor — but it also makes ground faults detectable and allows overcurrent protection to operate correctly

Bonding — tying metal parts together:

Bonding connects all metal parts in a system together so that no voltage difference exists between them
Without bonding: a fault in one piece of equipment can energize one metal surface while an adjacent metal surface remains at a different potential — a person bridging the two surfaces completes the circuit
With bonding: all metal surfaces are at the same potential — no current flows between bonded surfaces regardless of faults in connected equipment
Bonding is required between: the electrical grounding system and all metal water piping, metal gas piping, HVAC equipment, and structural steel in a building. In a community context: bond all metal systems that people may contact simultaneously

Grounding electrode system:

The grounding electrode is the physical connection between the electrical grounding system and the earth
Common grounding electrodes:

Ground rod: a copper-clad steel rod driven minimum 8 feet into the earth. Ground resistance shall be below 25 ohms — if one rod does not achieve this, a second rod driven 6 feet away and connected to the first is required
Water pipe: a metal water pipe with minimum 10 feet buried in earth — an excellent ground electrode where available
Foundation reinforcement: the steel reinforcement in a concrete foundation is an effective ground electrode when connected to the grounding system


Grounding electrode conductor: the conductor from the electrical panel to the grounding electrode — sized per the service entrance conductor size, minimum 8 AWG copper

Grounding in DC systems:
DC systems require grounding decisions that differ from AC systems:

Negative grounding: the most common DC grounding approach — the negative bus of the battery bank is connected to earth. This establishes the negative conductor at earth potential
Floating systems: some DC systems deliberately float (no connection to earth) — this eliminates the single-conductor shock hazard but makes ground faults undetectable by standard overcurrent protection
Community DC systems shall use negative grounding unless there is a specific technical reason for a floating system

Practical grounding for folk construction:
Where commercial grounding hardware is unavailable:

Copper pipe driven into damp soil provides a reasonable ground electrode — minimum 4 feet length, more effective in permanently moist soil
Multiple short electrodes connected together provide combined resistance lower than any single electrode
Metal water pipes buried in earth provide excellent ground electrodes — connect the grounding conductor to the pipe at a point that will remain accessible
The grounding conductor shall be as short and direct as possible — long, coiled, or looped grounding conductors have significant inductance that impairs their performance during fault conditions

Rationale: The equipment grounding function deserves specific technical explanation because the standard instruction — connect the ground wire — provides no insight into why equipment grounding works or why its absence is dangerous. A community member who understands that the equipment ground conductor provides a low-resistance path for fault current that triggers the overcurrent protection understands why a broken ground wire — one that appears connected but has a loose termination — provides no protection. The current will not flow through a broken ground conductor, the overcurrent protection will not trip, and the metal enclosure will remain energized. This understanding motivates proper termination of ground conductors at both ends — not just at the panel but at every device.
The paradox of system grounding — that it makes single-conductor contact more dangerous while making the overall system safer — is included because it explains why some improvised systems deliberately float their DC systems. A floating DC system requires contact with both the positive and negative conductors to complete a circuit — a single-conductor contact produces no current. This appears safer but it makes ground faults undetectable and allows faults to accumulate without tripping overcurrent protection. The community shall understand this tradeoff when making grounding decisions for DC systems.

1.8 Solar PV Systems — Wiring and Safety
Standard: Solar photovoltaic systems are the primary electrical generation technology for community energy independence in degraded infrastructure scenarios. They produce DC electricity at voltages ranging from 12V to over 600V depending on system configuration. The safety standards for solar PV systems differ from AC household wiring standards in important ways that community members operating these systems must understand.
Solar panel electrical characteristics:
Open circuit voltage (Voc):

The voltage a panel produces with no load connected — the maximum voltage the panel will ever produce
Increases in cold temperatures — panels in cold weather produce higher voltage than their nameplate rating
Critical for safety: Voc × number of panels in series = maximum system voltage. This voltage is present at the panel terminals even when no current is flowing

Short circuit current (Isc):

The current a panel produces when its terminals are shorted together — the maximum current the panel will ever produce
Increases in bright sunlight and at higher temperatures
Critical for safety: Isc × number of panels in parallel = maximum system current at the array

Maximum power point:

The combination of voltage and current at which the panel produces maximum power
Solar charge controllers use maximum power point tracking (MPPT) to operate the panels at their maximum power point

Series versus parallel wiring:
Series connection — increases voltage, maintains current:

Connect positive terminal of one panel to negative terminal of the next
Total voltage = sum of individual panel voltages
Total current = current of a single panel
Higher voltage systems (24V, 48V, and above) require series connections
Higher voltage reduces current for equivalent power — smaller wire can be used for the same power, reducing cost and voltage drop

Parallel connection — increases current, maintains voltage:

Connect all positive terminals together and all negative terminals together
Total voltage = voltage of a single panel
Total current = sum of individual panel currents
Used in 12V systems where panels are connected directly to a 12V battery
Higher current requires larger wire and produces more significant arc flash risk

Series-parallel combinations:

Groups of panels wired in series (called strings) connected in parallel — achieves higher voltage than parallel alone and higher current than series alone
The most common configuration for community-scale systems

String fusing:

Where multiple strings are connected in parallel, each string shall be individually fused at the combiner box
Without string fusing: a fault in one string can be fed by current from all other strings — the faulted string and its connections carry far more current than they are designed for
String fuse rating: 1.56 × Isc of a single string (accounts for temperature derating and safety margin)

Charge controllers:
Pulse Width Modulation (PWM) controllers:

Simpler, less expensive — connect the solar array directly to the battery and regulate charging by switching on and off
Array voltage must match battery voltage — 12V array for 12V battery
Less efficient than MPPT — some solar energy is wasted in the voltage matching process

Maximum Power Point Tracking (MPPT) controllers:

More sophisticated — convert array voltage to battery voltage efficiently
Allow higher-voltage arrays to charge lower-voltage batteries — a 48V array can charge a 24V battery bank
More efficient — 10-30% more energy harvested compared to PWM

Charge controller sizing:

Current rating: total array current (Isc × safety factor of 1.25) must not exceed the controller's rated input current
Voltage rating: array Voc (at minimum temperature × 1.25 safety factor) must not exceed the controller's rated input voltage
Exceeding the voltage rating destroys the charge controller immediately — this is the most common solar installation error

DC disconnects:
Array disconnect:

A disconnect switch between the solar array and the charge controller — allows the array to be isolated during maintenance
Required at the array side of the charge controller
Rated for DC service at the array voltage — AC-rated switches are not appropriate for DC disconnection at voltages above 48V

Battery disconnect:

A disconnect switch between the battery bank and the system — allows the battery to be isolated during maintenance
Required and shall be installed as close to the battery bank as possible
This is the most important disconnect in the system — the battery bank is the source of the highest fault current

Load disconnect:

A disconnect between the charge controller or inverter and the loads — allows loads to be disconnected without disconnecting the battery

PV system voltage hazards:

Solar arrays at open circuit voltage present a shock hazard proportional to their voltage
A 48V system: uncomfortable shock, rarely lethal in healthy adults with dry skin, potentially lethal under wet conditions
A 200V system: potentially lethal under any conditions
A 600V system: lethal — comparable to industrial electrical hazards
Solar panels cannot be turned off — as long as they are exposed to light they produce voltage. Cover panels with an opaque material before working on wiring

Rationale: The panel coverage requirement — covering panels with opaque material before working on wiring — is included because it is the only way to eliminate voltage at the panel terminals during maintenance. Solar panels are not switched off by any disconnect in the system — the DC disconnect between the array and the charge controller removes the panels from the circuit but does not eliminate voltage at the panels themselves. A person working on panel wiring with the array disconnect open is still working on energized conductors. Covering the panels with cardboard, plywood, or cloth reduces the light reaching the cells and dramatically reduces the voltage and current they produce — providing a meaningful but not complete voltage reduction. The correct statement is: covered panels are safer to work on, not safe to work on.
The MPPT controller voltage rating issue is addressed specifically because exceeding the controller's input voltage rating is among the most common and most expensive solar installation mistakes. The failure mechanism is immediate and complete — the controller's input protection circuitry is destroyed by the overvoltage event. This happens most commonly when panels are connected in winter or early morning when panel temperatures are lowest and Voc is highest — a string that operates within the controller's voltage rating in summer may exceed it on a cold winter morning. The 1.25 safety factor applied to Voc accounts for this temperature variation.

1.9 Battery Storage — Hazards and Safety Standards
Standard: Battery storage systems — lead-acid and lithium — are the energy storage component of community electrical systems and the component with the most significant and most underestimated hazards. Battery banks capable of delivering thousands of amperes into a fault are present in community solar systems that their builders and operators may regard as low-voltage and therefore low-hazard. The standards below address the specific hazards of each battery chemistry and the practices required for safe operation.
Lead-acid batteries:
Types:

Flooded lead-acid: the traditional battery with liquid electrolyte — requires maintenance (adding distilled water) and produces hydrogen gas during charging
Absorbed glass mat (AGM): electrolyte absorbed in fiberglass mat — sealed, no maintenance, lower hydrogen production
Gel: electrolyte in gel form — sealed, no maintenance, very low hydrogen production

The hydrogen explosion hazard:

Flooded lead-acid batteries produce hydrogen gas during charging — particularly during the equalization phase when charging voltage is elevated
Hydrogen is flammable at concentrations from 4-75% in air — a very wide flammable range
Hydrogen is lighter than air and accumulates at the highest point in an enclosed space
A single spark — from a switch, a connection, or static electricity — in a hydrogen-accumulation zone can cause explosion

Ventilation requirements for flooded lead-acid batteries:

Battery compartment shall be ventilated to the outside — not to the interior of an occupied space
Ventilation rate: minimum air changes to maintain hydrogen concentration below 1% (25% of the lower flammable limit)
Natural ventilation: high vent at the top of the battery compartment (where hydrogen accumulates) and low vent at the bottom. The temperature difference drives airflow
Forced ventilation: a fan drawing air from the battery compartment to the exterior — required where natural ventilation is inadequate
No ignition sources in the battery compartment: no switches, no outlets, no lights with exposed contacts, no fuses that arc when they blow

Lead-acid maintenance:

Check electrolyte level monthly — add distilled water (not tap water, which contains minerals that contaminate the electrolyte) when the plates are exposed
Check specific gravity with a hydrometer — specific gravity indicates state of charge and battery health
Clean terminal corrosion — white or blue-green deposits on battery terminals increase resistance and reduce charging efficiency. Clean with a baking soda solution and wire brush, rinse with water, dry, and apply terminal grease or petroleum jelly

Lithium batteries (LiFePO4 and other lithium chemistries):
The thermal runaway hazard:

Lithium batteries can enter thermal runaway — a self-reinforcing exothermic reaction that produces heat faster than it can be dissipated, causing the battery to heat to extreme temperatures and potentially catch fire or explode
Causes of thermal runaway: overcharging, over-discharging, physical damage, internal short circuit, external heat exposure
LiFePO4 (lithium iron phosphate) batteries are significantly more thermally stable than other lithium chemistries (NMC, NCA, LCO) — they are the appropriate choice for stationary community energy storage
LiFePO4 batteries rarely experience thermal runaway under normal operating conditions — the hazard is primarily from physical damage, charging beyond the maximum voltage, or discharging below the minimum voltage

Battery management system (BMS):

Every lithium battery installation shall include a battery management system — electronics that monitor cell voltages, temperatures, and current and interrupt charging or discharging when parameters exceed safe limits
A lithium battery without a BMS can be overcharged or over-discharged to the point of permanent damage or thermal runaway
The BMS shall be rated for the battery bank's voltage and current — a BMS that cannot handle the charge or discharge current of the battery bank will fail under load

LiFePO4 specific requirements:

Maximum charge voltage: 3.65V per cell (14.6V for 4-cell 12V battery, 29.2V for 8-cell 24V battery, 58.4V for 16-cell 48V battery)
Minimum discharge voltage: 2.5V per cell (10V for 4-cell 12V battery, 20V for 8-cell 24V battery, 40V for 16-cell 48V battery)
Operating temperature: charge only above 32°F — charging below freezing causes lithium plating that permanently damages the battery and increases thermal runaway risk
Storage temperature: -4°F to 113°F — do not store in locations that reach extreme temperatures

The arc flash hazard in battery systems:

A large battery bank can deliver current limited only by the resistance of the fault — a direct short circuit across a large LiFePO4 battery bank can produce tens of thousands of amperes
At these currents, the arc flash energy is enormous — sufficient to cause severe burns at several feet, to vaporize copper conductors, to cause explosive pressure waves
The arc flash hazard is highest during: initial connection of battery bank cables, installation of overcurrent protection, and any work on the battery bus

Safe practices for battery bank connection:

The final connection to the battery bank — the last connection that completes the circuit — shall always be made at the overcurrent protection device (fuse or breaker), not at the battery terminal
If the overcurrent device arcs during connection, the arc is contained within the device. If the battery terminal arcs, the arc occurs in open air adjacent to the battery
Use insulated tools when working near battery terminals — a metal tool that spans two battery terminals or that contacts a terminal and a grounded surface will cause an arc flash
Remove watches, rings, and metal jewelry before working near battery banks — these can complete a circuit if they contact terminals or a terminal and a grounded surface
One-hand rule: where possible, work with one hand while keeping the other hand away from the battery system — a hand-to-hand fault path passes through the heart

Rationale: The arc flash hazard in battery systems is addressed with specific detail because it is categorically underestimated by community members who think of battery systems as low-voltage and therefore low-hazard. The hazard in electrical systems is not solely a function of voltage — it is a function of available fault current, which in a large battery bank is enormous regardless of voltage. A 48V LiFePO4 battery bank with 300Ah of capacity can deliver 5,000-10,000 amperes into a bolted fault — current that would produce an arc flash of industrial severity. The 48V nominal voltage of such a system is below the threshold that conventional electrical safety standards consider requiring special precautions, but the fault current capacity is above the threshold at which serious arc flash injuries occur. Community members operating large battery banks shall understand that the relevant hazard metric is not nominal voltage but fault current capacity, and that large battery banks require the same arc flash precautions as medium-voltage industrial systems.
The BMS requirement for lithium systems is absolute because the consequences of operating lithium batteries without cell-level monitoring are unpredictable and potentially catastrophic. In a series-connected battery bank without a BMS, individual cells can drift to different states of charge. The weak cell — the one with less capacity than its neighbors — reaches full charge before the others during charging and reaches minimum discharge voltage before the others during discharging. Without a BMS, neither the charger nor the discharge controller knows about the weak cell — they monitor total bank voltage, which appears acceptable while the weak cell is being overcharged or over-discharged beyond safe limits. The weak cell deteriorates progressively until it fails — potentially with fire or explosion in severe cases.

1.10 Generator Systems — Safety and Integration
Standard: Generators — internal combustion engines driving electrical alternators — provide AC power from liquid fuel in the absence of solar generation or grid power. They are valuable community electrical resources and the source of several specific and serious hazards: carbon monoxide poisoning, backfeed electrocution, fuel fire, and overloading. Each hazard has caused deaths in community and household settings and each is preventable with knowledge.
Carbon monoxide — the primary generator hazard:
Why generators produce carbon monoxide:

Internal combustion engines produce carbon monoxide (CO) as a byproduct of incomplete combustion — all generators produce CO regardless of their condition
CO is odorless, colorless, and tasteless — it provides no sensory warning of its presence
CO is slightly lighter than air and disperses in outdoor conditions but accumulates in enclosed or partially enclosed spaces

CO poisoning physiology:

CO binds to hemoglobin — the oxygen-carrying protein in red blood cells — with 200 times the affinity of oxygen
Hemoglobin saturated with CO cannot carry oxygen — tissue oxygen deprivation occurs even though the person is breathing normally
Symptoms: headache, dizziness, weakness, nausea — symptoms that are easily misattributed to other causes. A person experiencing CO poisoning may not recognize it as such
Severe exposure: loss of consciousness, cardiac arrhythmia, death
The most dangerous aspect of CO poisoning is that the victim may lose consciousness before recognizing the hazard — they cannot evacuate themselves

Generator placement standards:

Generators shall be operated exclusively outdoors — not in garages, not in carports, not in partially enclosed spaces, not near open windows or doors
Minimum distance from any opening (window, door, vent): 20 feet upwind. CO can enter a building through openings even at 10-15 feet if wind carries the exhaust toward the building
The exhaust direction matters — exhaust shall be directed away from the building and away from any occupied area
There is no safe way to operate a generator indoors — not with a window open, not with a fan running, not with a short run time. Every year people die from generators operated in enclosed spaces with windows open

CO detection:

CO detectors shall be installed in any space that could be affected by generator exhaust — every sleeping area, every common area
CO detectors shall be battery-powered or have battery backup — the situations where a generator is needed often involve grid power failure that would render a plug-in CO detector non-functional
CO detector placement: CO disperses relatively evenly in air and can be detected at any height — place detectors at the height where sleeping occupants breathe (approximately 5 feet from the floor for sleeping)
Any CO alarm shall result in immediate evacuation — move all occupants to fresh air before investigating the source

Backfeed — the electrocution hazard:
What backfeed is:

When a generator is connected to the community's wiring without a proper transfer switch, the generator powers not only the community's internal circuits but also the distribution lines serving the community from the outside
Utility workers or community members working on what they believe is de-energized distribution wiring are exposed to potentially lethal voltage from the generator
Backfeed voltage on distribution lines is transformed up to distribution voltage — a 120V generator can produce thousands of volts on distribution lines through transformer backfeed
Backfeed has killed utility workers and electricians who were working on lines they had verified were de-energized at the utility source

Transfer switch — the only safe generator connection:

A transfer switch is a device that disconnects the building or community distribution from the external supply before connecting the generator
Interlocked transfer switches make it mechanically impossible to connect both the external supply and the generator simultaneously
Every generator connected to the community's wiring shall use an interlocked transfer switch — no exceptions
The simplest safe connection: a generator with its own dedicated circuits using extension cords — running extension cords directly from the generator to the loads, without connecting to the building wiring at all. This eliminates backfeed entirely

Generator sizing:
Starting versus running current:

Electric motors require 3-7 times their running current to start — the momentary current spike when the motor begins turning
A generator that is adequately sized for running loads may not be large enough to start the largest motor load
Generator sizing rule: running load × 1.25 for continuous rating, plus the starting surge of the largest motor in the system

Load management:

Community generators shall be managed to prevent overloading — running too many loads simultaneously
A load priority list shall be established and followed: critical loads (water pump, medical equipment, refrigeration) have priority over non-critical loads (lighting, fans, tools)
Starting large motor loads (pumps, compressors) one at a time rather than simultaneously prevents simultaneous starting surges that overwhelm generator capacity

Generator maintenance:
The maintenance standard:

A generator that has not been run under load in 6 months will not reliably start in an emergency
Monthly test run: start the generator and run it under at least 50% load for 30 minutes minimum
Oil change: every 100 hours of operation or annually — whichever comes first. Dirty oil accelerates engine wear and reduces reliability
Air filter: inspect monthly, replace when dirty
Fuel management: fresh fuel is critical — gasoline stored for more than 3-6 months without fuel stabilizer degrades and may prevent starting. Treat stored fuel with stabilizer or rotate the fuel stock

Rationale: The backfeed electrocution hazard is addressed with specific emphasis because it is among the most consistently fatal generator-related hazards and the one most invisible to the generator operator. The person who connects a generator to a building panel using a suicide cord — a double-male plug that connects the generator to an outlet — is in no immediate danger. The worker on the distribution line 500 feet away, who has verified that the grid is de-energized and is working without protective equipment, is the person who dies. This spatial separation between the action (generator connection) and the consequence (electrocution) makes the hazard invisible to the person creating it. The transfer switch requirement is the mechanism that prevents this hazard — the physical interlocking that makes simultaneous connection of generator and grid impossible.
The CO placement standard — 20 feet upwind from any opening — is significantly more conservative than many informal guidelines suggest, and the conservatism is justified by the physics. CO at the generator exhaust is at high concentration — hundreds to thousands of parts per million. Wind disperses it but does not eliminate it. A building with a generator running 10 feet from an open window can accumulate significant CO concentrations inside regardless of wind direction variation. The 20-foot standard accounts for wind shifts and eddy currents that can carry CO toward openings even when the generator appears to be downwind of the building.

1.11 Community Electrical Infrastructure — Distribution and Safety Management
Standard: Community-scale electrical distribution — distributing power from central generation to multiple households and facilities — introduces hazards and management requirements beyond those of individual household systems. The standards below address the specific challenges of community electrical infrastructure including distribution wiring, voltage drop management, access control, and the community electrical safety officer role.
Distribution system design:
Voltage selection for distribution:

The voltage at which power is distributed determines wire sizing and losses over distance
Low voltage DC (12V, 24V): severe voltage drop over any significant distance — practical only for very short distribution runs (under 50 feet) at low loads
Higher voltage DC (48V): reduced voltage drop compared to 12V/24V, practical for moderate distribution distances
AC distribution (120V or 240V): standard for building-to-building distribution — AC transformers allow voltage to be stepped up for long-distance distribution and stepped down at the point of use, minimizing losses
For community distribution beyond 200 feet: AC distribution at 120V or 240V is strongly preferred over DC distribution at any voltage

Voltage drop in community distribution:

Voltage drop increases with distance and current and decreases with wire size
At 5% acceptable voltage drop, the maximum distribution distance for various systems carrying 10A:

12V DC with 10 AWG wire: approximately 12 feet — essentially unusable for distribution
48V DC with 10 AWG wire: approximately 48 feet — limited distribution
120V AC with 10 AWG wire: approximately 120 feet — reasonable distribution
240V AC with 10 AWG wire: approximately 240 feet — good distribution range


For longer distribution distances: larger wire reduces voltage drop at the cost of material. Alternatively, distribute at higher voltage and transform down at the point of use

Distribution wiring standards:
Overhead distribution:

Overhead wiring shall maintain minimum clearances:

Above pedestrian areas: minimum 10 feet
Above vehicle traffic areas: minimum 15 feet
Above roofs of buildings: minimum 3 feet above the roof surface


Conductors shall be supported at intervals not exceeding their sag limits — unsupported spans that sag excessively contact vegetation, structures, and people
Overhead conductors shall be insulated — bare conductors in community overhead distribution create contact hazards for people and for conductive objects (long poles, ladders, metal roofing materials)
Weatherhead or drip loop: where overhead wiring enters a building, a drip loop (a U-shaped curve in the wire before it enters the building) prevents water from running down the wire and into the building

Underground distribution:

Underground wiring eliminates overhead contact hazards and is protected from wind and weather
Burial depth: minimum 24 inches for direct-buried cable, 18 inches for cable in conduit
Direct-buried cable shall be rated for direct burial — standard indoor wiring is not rated for burial and will deteriorate rapidly in soil
Location marking: underground cables shall be marked at the surface — a continuous marker (surface stakes, surface tape, surface paint) along the entire run. Unmarked buried cable is a hazard for any subsequent digging activity
Warning tape: orange or yellow warning tape buried 12 inches above the cable alerts diggers approaching the cable before they reach it

Service entrance to buildings:

The connection from the distribution system to each building's internal wiring is the service entrance
Each service entrance shall have: a main disconnect (switch or breaker) that isolates the building's wiring from the distribution, overcurrent protection sized to the service entrance conductor, and a means of disconnecting the service without entering the building (exterior disconnect or readily accessible interior disconnect)
The main disconnect allows the building's wiring to be de-energized for maintenance without de-energizing the distribution system

Community electrical safety officer:
Role and responsibilities:

The community electrical safety officer is responsible for: maintaining documentation of the community electrical system, conducting regular system inspections, managing electrical maintenance, training community members in safe electrical practices, responding to electrical emergencies, and authorizing modifications to the community electrical system
The electrical safety officer shall have demonstrated knowledge of the standards in this document — not necessarily formal electrician training but documented understanding of the safety principles and practical skills
A backup electrical safety officer shall be trained and designated — electrical emergencies do not wait for the primary officer to be available

System documentation:

A complete as-built drawing of the community electrical system shall be maintained — showing the location of all distribution wiring, all overcurrent protection, all disconnects, and all major equipment
The drawing shall be updated when any modification is made — an inaccurate drawing is more dangerous than no drawing because it creates false confidence in the system layout
The drawing shall be stored in a location accessible to all community members authorized to work on the electrical system — not locked away with one person

Inspection schedule:

Annual inspection of all accessible wiring and connections — look for: discolored insulation indicating heat damage, corroded connections, loose connections, missing overcurrent protection covers, damaged equipment
Quarterly inspection of all overcurrent protection — verify that fuses are correctly rated, breakers operate correctly (test the trip function on breakers with test buttons), and that no overcurrent devices have been bypassed
Monthly inspection of battery systems — electrolyte levels, terminal corrosion, state of charge, and any unusual heat or smell from the battery compartment
After any significant electrical event (outage, storm damage, circuit failure) — immediate inspection of the affected area before restoration of power

Hazard identification and response:
Immediate shutdown criteria — de-energize the affected circuit or system immediately:

Any burning smell from electrical equipment or wiring
Any visible arcing or sparking from connections or equipment
Any discoloration or melting of insulation
Any electrical shock to a community member
Any electrical fire, regardless of apparent extinguishment
Any flooding of spaces containing electrical equipment

Post-event restoration:

A circuit or system that has been de-energized due to a hazard shall not be restored until the cause of the hazard has been identified and corrected
The electrical safety officer shall authorize restoration after verifying that the hazard has been corrected
Restoration of power to a circuit or system that caused a fire, shock, or other hazard without identifying and correcting the cause repeats the hazard

Rationale: The system documentation requirement is included as a mandatory standard rather than a best practice because electrical systems without documentation become unmanageable over time in ways that create serious hazards. A community electrical system installed by one person, modified by another, repaired by a third, and extended by a fourth — without any documentation — becomes a system where no one knows what is connected to what, where the circuits go, what size wire was used, or what the overcurrent protection ratings are. A community member who needs to de-energize a circuit to make a repair cannot be certain they have identified the correct breaker without documentation. A community member who wants to add a load cannot determine whether the existing circuit has capacity without knowing its wire size and overcurrent protection rating. Undocumented electrical systems are operated by guesswork — and guesswork in electrical systems produces fires and electrocutions.
The immediate shutdown criteria are stated as absolute standards rather than guidelines because the events they describe — burning smell, arcing, insulation melting — indicate that the electrical system has already exceeded its safe operating conditions and that continued operation will produce worse outcomes. A burning smell from wiring is a fire in progress inside the wall, not a warning that a fire might start. Arcing at a connection is ignition energy being applied to surrounding materials at 6,000-20,000°F, not a sign that the connection should be tightened. The instinct to investigate before shutting down is understandable — shutting down power is disruptive. The correct sequence is: shut down, then investigate. A community that has internalized this sequence protects itself from the most common electrical emergency escalation path.

1.12 Special Hazards — Water Proximity, Buried Cables, Arc Flash, and Safe Work Practices
Standard: Several electrical hazards require specific standards beyond general wiring and system design — the hazards associated with water proximity, buried cable damage, arc flash from high-current systems, and the safe work practices that prevent electrical injury during maintenance and installation. These standards apply to all community electrical work regardless of system size or voltage.
Water and electricity proximity:
The fundamental hazard:

Water dramatically reduces the body's electrical resistance — wet skin resistance is 10-50 times lower than dry skin resistance
Water provides conductive pathways between electrical systems and people — a puddle connecting a grounded appliance and an energized surface creates a current path through anyone standing in or touching the puddle
Wet locations are defined as any location where water is regularly present — bathrooms, kitchens, outdoor areas, basements subject to flooding, any area near water storage or distribution

Wet location electrical standards:

All outlets in wet locations shall be GFCI-protected — the 5mA ground fault threshold detects current flowing through the water-to-person path before it reaches lethal levels
All lighting in wet locations shall be rated for wet or damp locations — fixtures not rated for wet use allow water to enter and contact energized components
No electrical connections or splices in wet locations unless in weatherproof enclosures rated for the specific wet location classification
No extension cords in wet locations — extension cord insulation is not rated for sustained wet exposure and the connections at the plug ends are not weatherproof

Flooding response:

Never enter a flooded space that contains electrical equipment until power to the space has been verified as de-energized
Standing water in contact with energized electrical equipment creates a potential field throughout the water — a person entering the flooded space from dry ground can receive a shock without touching any electrical equipment
Verify de-energization at the main disconnect, not just at individual circuit breakers — a flooded panel may have damaged breakers that appear to have tripped but have not interrupted the circuit

Buried cable damage prevention:
The hazard:

Buried electrical cables struck by digging equipment or hand tools are immediately energized — the tool and the person holding it receive the full circuit voltage
At distribution voltages (120V, 240V) this exposure is frequently fatal
The person digging may have no warning — underground cables are invisible until they are struck

Prevention standards:

All buried cables shall be documented with location, depth, and route — per Section 1.11
Before any digging in the community: verify with the electrical safety officer whether cables are present in the dig area
Hand-dig within 18 inches of any known cable location — power equipment shall not be used within 18 inches of a buried cable
If an unmarked cable is encountered during digging: stop immediately, do not attempt to move or cut the cable, de-energize from the nearest disconnect before proceeding

Arc flash protection:
When arc flash risk is present:

Arc flash risk is present whenever energized high-current conductors are exposed or connections are made or broken in high-current systems
High-current systems in community context: battery bank terminals and bus connections (any battery bank above approximately 100Ah at 48V), generator output terminals during connection, inverter input terminals

Minimum arc flash protection:

Safety glasses or face shield — arc flash produces intense light and molten metal droplets
Insulated gloves rated for the system voltage — leather or rubber gloves that prevent hand contact with energized conductors
Natural fiber clothing — polyester and synthetic fabrics melt and stick to skin when exposed to arc flash heat. Cotton and wool char but do not melt
No metal jewelry or watches — metal jewelry can complete a circuit or concentrate arc flash burns

Safe work practices:
The one-hand rule:

Where possible, work with one hand while keeping the other hand away from electrical equipment and grounded surfaces
A fault that causes current to flow from one hand to the other passes directly through the heart — the most lethal current path
A fault from one hand to a foot or from one hand to a grounded surface at the same side of the body has a current path that may bypass the heart

De-energization before work:

All electrical work shall be performed on de-energized circuits where possible
Energized work is work performed on live circuits — it requires specific justification (de-energizing would create greater hazard than working live, or is not possible for operational reasons) and enhanced precautions
De-energization procedure:

Identify all sources of power to the circuit — circuits may have more than one source (generator plus battery plus solar)
Open all overcurrent devices and disconnects for the circuit
Verify absence of voltage with a non-contact voltage tester at the work location
Apply lockout if available — a physical lock that prevents the disconnect from being closed while work is in progress
Verify absence of voltage again after lockout



Non-contact voltage testers:

A non-contact voltage tester (NCV tester) detects the presence of AC voltage through insulation without making contact with the conductor
The most valuable personal safety tool for electrical work — it allows verification of de-energization before touching conductors
Verify that the tester is working before use — test it on a known-live circuit immediately before testing the circuit being worked on
NCV testers do not reliably detect DC voltage — use a DC voltmeter to verify absence of DC voltage

Electrical emergency response — community level:
Immediate response:

Electrical emergency (shock, fire, arc flash): call for help immediately while de-energizing the source
De-energize from the nearest accessible disconnect — do not approach the victim until the source is de-energized
Once de-energized: provide first aid per Section 1.2 response protocol
Any electrical fire: de-energize before applying any extinguishing agent. Water on an energized electrical fire creates electrocution risk. Use a CO2 or dry chemical extinguisher on electrical fires. If the circuit cannot be de-energized, evacuate and allow the fire to burn or self-extinguish rather than applying water

Community notification:

Any significant electrical event — shock, fire, arc flash, flooding of electrical equipment — shall be reported to the electrical safety officer within 24 hours
The electrical safety officer shall document the event, investigate the cause, and implement corrective action before the affected circuit or system is restored to service

Rationale: The flooding response standard — never enter a flooded space containing electrical equipment until power is verified de-energized — is included because flooding combined with energized electrical equipment is consistently among the most lethal electrical hazard combinations encountered in disaster situations. The physics of standing water adjacent to energized electrical equipment create a potential field (ground potential rise) throughout the water that energizes the entire flooded area. A person entering the flooded area from dry ground is stepping from the ground reference potential into a higher potential — the voltage difference drives current through their body. This hazard is invisible — the water does not spark or glow, there is no visible indication that it is energized. The standard is absolute because the consequences of the error are severe and the correct behavior (verify de-energization before entering) takes 30 seconds.
The de-energization verification sequence — test before lockout, then test again after lockout — is the procedure that prevents the most common safe work practice failure: assuming a circuit is de-energized because the breaker was turned off, without verifying. Breakers can fail in the closed position — the handle indicates off but the contacts remain closed. A panel can have two sources of power — de-energizing one source leaves the circuit energized from the other. The voltage tester verification converts an assumption into a measured fact. Testing after lockout catches the case where the wrong circuit was de-energized — the lockout is on the correct breaker but the circuit is still energized from another source. Two verification steps are the minimum for a reliable de-energization confirmation.