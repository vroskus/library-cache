// Helpers
import JSCacheTags from './lib';

// Types
import type {
  $Tags,
  $Config as Config,
} from './types';

export type $Config = Config;

const defaultTtl: number = 10000;

class CacheService<C extends $Config> {
  cache: JSCacheTags;

  ttl: number;

  constructor({
    ttl,
  }: C) {
    this.cache = new JSCacheTags();

    this.ttl = ttl || defaultTtl;
  }

  async get<D>({
    getDataAction,
    key,
    tags,
    ttl,
  }: {
    getDataAction: () => Promise<D>;
    key: string;
    tags: $Tags;
    ttl?: number;
  }): Promise<D> {
    let cachedData = await this.#getData<D>(key);

    if (cachedData === null) {
      cachedData = await getDataAction();

      this.#saveData(
        key,
        tags,
        ttl || this.ttl,
        cachedData,
      );
    }

    return cachedData;
  }

  #getData<D>(key: string): Promise<D | null> {
    return new Promise((resolve, reject) => {
      this.cache.get(
        key,
        (error, cachedData) => {
          if (!error) {
            if (cachedData === undefined) {
              return resolve(null);
            }

            return resolve(cachedData);
          }

          return reject(error);
        },
      );
    });
  }

  #saveData<D>(key: string, tags: $Tags, ttl: number, data: D): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.cache.set(
        key,
        data,
        tags,
        ttl,
        (error, result) => {
          if (error) {
            return reject(error);
          }

          return resolve(result);
        },
      );
    });
  }

  clear({
    tag,
  }: {
    tag: string;
  }): Promise<{
      count: number;
    }> {
    return new Promise((resolve, reject) => {
      this.cache.delByTags(
        [tag],
        (error, count) => {
          if (error) {
            return reject(error);
          }

          return resolve({
            count,
          });
        },
      );
    });
  }
}

export default CacheService;
