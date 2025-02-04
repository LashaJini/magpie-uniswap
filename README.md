# Backend Developer Test

## Build a NestJS Backend Application with Periodic Subgraph Data Synchronisation

### Objective

Develop a NestJS backend application in TypeScript that periodically fetches data from the UniswapV3 subgraph and stores the data in a database.

#### Requirements

- [x] Set up a new NestJS project with TypeScript.
- [ ] Develop a comprehensive solution to synchronize UniswapV3 pool and tick data into a PostgreSQL database using NestJS, enabling accurate pricing calculations. Additionally, explain the rationale behind the chosen architecture and structure.
- [ ] Create a service to fetch data from the UniswapV3 subgraph using the GraphQL query examples provided in their documentation (<https://docs.uniswap.org/api/subgraph/guides/examples>).
- [ ] Implement functions in the service to parse the fetched data and store it in the respective tables, updating existing entries if necessary.
- [ ] Set up a periodic task to fetch data from the UniswapV3 subgraph and synchronize the data in the database every 30 minutes.
- [ ] Provide clear instructions on how to set up the application and run it locally.
- [ ] Make the structure easily extendable and scalable.

#### Deliverables

- [x] A newly created NestJS project using TypeScript with the configuration files and initial setup documentation.
- [ ] SQL scripts or ORM models for creating the tables in the PostgreSQL database.
- [ ] A service to fetch data from the UniswapV3 subgraph using the provided GraphQL queries.
- [ ] Source code of the service with methods to fetch and parse data.
- [ ] Source code implementing a solution to synchronize UniswapV3 data into the PostgreSQL database.
- [ ] Documentation explaining the rationale behind the chosen architecture and structure.
- [ ] Clear instructions on how to set up the application and run it locally.

#### Bonus

- [ ] Instead of GraphQL, collect data from the ethereum blockchain using the ethers library.
- [ ] The solution is performance optimised and scalable from database and NestJS side also.
- [ ] Attention to details concerning concurrency issues.
- [ ] Add unit tests.
