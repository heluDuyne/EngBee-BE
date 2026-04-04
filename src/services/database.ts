import { AppDataSource } from "../data-source";

/**
 * Database utility functions for service layer
 */

export const getRepository = (entityClass: any) => {
  return AppDataSource.getRepository(entityClass);
};

export const getQueryBuilder = (entityClass: any, alias: string) => {
  return AppDataSource.createQueryBuilder(entityClass, alias);
};
