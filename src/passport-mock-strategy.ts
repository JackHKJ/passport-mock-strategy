import { Request } from 'express';
import { Strategy } from 'passport';

import mockUser, { User } from './mock-user';

export interface MockStrategyOptions {
  name?: string;
  user?: User | any;
  passReqToCallback?: true;
}

export type DoneCallback = (
  error: Error,
  user?: User | any,
  info?: any,
) => void;

export type VerifyFunction = (user: User | any, done: DoneCallback) => void;
export type VerifyFunctionWithReq = (
  req: Request,
  user: User | any,
  done: DoneCallback,
) => void;

/**
 * Mock Passport Strategy for testing purposes.
 * @extends Strategy
 */
export default class MockStrategy extends Strategy {
  private _user: User | any;
  private _verify?: VerifyFunction | VerifyFunctionWithReq | any;
  private _passReqToCallback: boolean;
  /**
   * The MockStrategy constructor.
   *
   * This allows you to test authenticated routes using a mock strategy.
   * It will automatically authenticate a mock user which then allows the
   * functionality of authenticated routes to be tested independent of
   * the authentication process.
   *
   * Note: This strategy is meant for testing purposes only.
   * It provides no actually security.
   *
   * Optionally an `options` object can be passed to custom configure the Strategy.
   * options = {
   *  name: String - The name of the strategy, defaults to 'mock'
   *  user: Object - The mock user to be authenticated, defaults to ./mock-user.js
   *  passReqToCallback: Boolean - When true `req` is the first argument to the
   *                                  verify callback, defaults to false
   * }
   *
   * A `verify` callback can also optionally passed which accepts `user`
   * which is the user that was authenticated and then calls the `done`
   * callback supplying a `user`. Optionally an error can be set as the
   * first argument in `done` if needed for testing.
   *
   * Calling the constructor with no parameters while create a default mock
   * strategy which a mock user exported from `./mock-user.js`.
   *
   *  @param {Object} options
   *  @param {Function} verify
   */
  constructor(
    options?: MockStrategyOptions,
    verify?: VerifyFunction | VerifyFunctionWithReq | any,
  ) {
    // Allows verify to be passed as the first parameter and options skipped
    if (typeof options === 'function') {
      verify = options;
      options = undefined;
    }

    options = options || {};

    super();
    this.name = options.name || 'mock';
    this._user = options.user || mockUser;
    this._verify = verify;
    this._passReqToCallback = options.passReqToCallback || false;
  }

  /**
   * Authenticate request. Always authenticates successfully by default
   * unless instructed otherwise through `verify` callback that was
   * passed to the constructor.
   *
   * @param {Object} req
   */
  public authenticate(req?: Request) {
    // If no verify callback was specified automatically authenticate
    if (!this._verify) {
      return this.success(this._user);
    }

    const verified: DoneCallback = (error, user, info) => {
      if (error) {
        return this.error(error);
      }

      if (!user) {
        return this.fail(info);
      }

      this.success(user, info);
    };

    try {
      if (this._passReqToCallback && req) {
        this._verify(req, this._user, verified);
      } else {
        this._verify(this._user, verified);
      }
    } catch (e) {
      return this.error(e);
    }
  }
}
