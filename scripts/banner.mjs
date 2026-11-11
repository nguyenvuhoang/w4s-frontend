import figlet from "figlet";
import chalk from "chalk";

const banner = figlet.textSync("O24", {
  font: "ANSI Shadow",
  horizontalLayout: "default",
  verticalLayout: "default",
});

console.log();
console.log(chalk.hex("#FF6B00")(banner));
console.log(chalk.gray("  O24 Enterprise Platform"));
console.log(chalk.gray("  Starting Next.js application..."));
console.log();