import { isTokenExpired } from "./../validators/token.validator.ts";
import { user, userWithId, userWithRefresh } from "../models/user.interface";
import { genSaltSync, hashSync, compareSync } from "bcrypt-ts";
import { User } from "../entities/user.entities.ts";
import message from "../common/message/message.common.ts";

import jwt from "jsonwebtoken";

export const register = async (data: user) => {
  return new Promise(async (resolve, reject) => {
    try {
      const salt = genSaltSync(10);
      const hashPassword = hashSync(data.password, salt);
      const record = await User.findOne({ where: { username: data.username } });

      if (!record) {
        await User.create({
          username: data.username,
          password: hashPassword,
        });
        resolve({ mes: message.CREATE_ACCOUNT_SUCCESS });
      }
      resolve({ mes: message.DUBLICATE_RECORD_ACCOUNT });
    } catch (error) {
      reject(error);
    }
  });
};

export const login = async (data: user) => {
  return new Promise(async (resolve, reject) => {
    try {
      const record: userWithId = await User.findOne({
        where: { username: data.username },
      });

      if (record && record.refreshToken) {
        var newData: any = {
          username: record.username,
        };
        let check = compareSync(data.password, record.password);

        if (check) {
          if (isTokenExpired(record.refreshToken)) {
            let newRefreshToken = jwt.sign(
              {
                data: newData,
              },
              process.env.SECRET_TOKEN,
              { expiresIn: "720h" }
            );
            let newAccessToken = jwt.sign(
              {
                data: newData,
              },
              process.env.PRIVATE_TOKEN,
              { expiresIn: "24h" }
            );
            await User.update(
              {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
              },
              { where: { username: record.username } }
            );
            newData.accessToken = newAccessToken;
            newData.refreshToken = newRefreshToken;
            resolve({ data: newData, errCode: 0 });
          } else {
            let newAccessToken = jwt.sign(
              {
                data: newData,
              },
              process.env.PRIVATE_TOKEN,
              { expiresIn: "24h" }
            );
            await User.update(
              {
                accessToken: newAccessToken,
              },
              { where: { username: record.username } }
            );
            newData.accessToken = newAccessToken;
            newData.refreshToken = record.refreshToken;
            resolve({ data: newData, errCode: 0 });
          }
        }
        resolve({ errCode: 1 });
      }

      if (record && !record.refreshToken) {
        var newData: any = {
          username: record.username,
        };
        let check = compareSync(data.password, record.password);
        if (check) {
          let newRefreshToken = jwt.sign(
            {
              data: newData,
            },
            process.env.SECRET_TOKEN,
            { expiresIn: "720h" }
          );
          let newAccessToken = jwt.sign(
            {
              data: newData,
            },
            process.env.PRIVATE_TOKEN,
            { expiresIn: "24h" }
          );
          await User.update(
            {
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            },
            { where: { username: record.username } }
          );
          newData.accessToken = newAccessToken;
          newData.refreshToken = newRefreshToken;
          resolve({ data: newData, errCode: 0 });
        }
        resolve({ errCode: 1 });
      }

      resolve({ mes: message.ACCOUNT_NOT_FOUND });
    } catch (error) {
      reject(error);
    }
  });
};

export const refreshTK = async (data: userWithRefresh) => {
  return new Promise(async (resolve, reject) => {
    try {
      const record = await User.findOne({ where: { username: data.username } });
      
      if (
        record &&
        record.username == data.username &&
        record.refreshToken == data.refreshToken
      ) {
        const newData = {
          username: record.username,
        }
        if (!isTokenExpired(record.refreshToken)) {
          let newAccessToken = jwt.sign(
            {
              data: newData,
            },
            process.env.PRIVATE_TOKEN,
            { expiresIn: "24h" }
          );
          await User.update(
            {
              accessToken: newAccessToken,
            },
            { where: { username: record.username } }
          );
          resolve({
            data: { username: record.username, accessToken: newAccessToken },
            errCode: 0,
          });
        }
        if (isTokenExpired(record.refreshToken)) {
          let newAccessToken = jwt.sign(
            {
              data: newData,
            },
            process.env.PRIVATE_TOKEN,
            { expiresIn: "24h" }
          );
          let newRefreshToken = jwt.sign(
            {
              data: newData,
            },
            process.env.SECRET_TOKEN,
            { expiresIn: "720h" }
          );
          await User.update(
            {
              accessToken: newAccessToken,
              refreshToken: newRefreshToken
            },
            { where: { username: record.username } }
          );
          resolve({
            data: { username: record.username, accessToken: newAccessToken, refreshToken: newRefreshToken },
            errCode: 0,
          });
        }
      }
      resolve({ errCode: 1 });
    } catch (error) {
      reject(error);
    }
  });
};

