import * as appRoot from "app-root-path";
import nodePath from "path";
import fs from "fs-extra";
import postcssLib, { plugin } from "postcss";

export const defaultDirectory = nodePath.join(
  appRoot.toString(),
  "@types",
  "ct.macro"
);

export const classnamesFilename = "classnames.d.ts";

const initializer = ({ directory = "" } = {}) => {
  const dest = directory || defaultDirectory;

  const indexFileOutput = fs.outputFile(
    nodePath.join(dest, "index.d.ts"),
    `\
// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.
declare module "ct.macro" {
const _default: (...args: ClassNames[]) => string;

export default _default;
}`
  );

  return async (root: postcssLib.Root) => {
    const classes: string[] = [];

    root.walkRules(rule => {
      rule.selector.split(",").forEach(subSelector => {
        /[^.]+$/.exec(subSelector)?.forEach(match => {
          classes.push(match);
        });
      });
    });

    return Promise.all([
      indexFileOutput,
      fs.outputFile(
        nodePath.join(dest, "classnames.d.ts"),
        `type ClassNames = "${classes.join('" | "')}"`
      ),
      fs.outputJSON(nodePath.join(dest, "classnames.json"), classes),
    ]);
  };
};

type options = Parameters<typeof initializer>[0];

export const postcss = plugin<options>("postcss-ct.macro", initializer);