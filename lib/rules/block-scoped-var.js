/**
 * @fileoverview Rule to check for "block scoped" variables by binding context
 * @author Matt DuVall <http://www.mattduvall.com>
 */
"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/** @type {import('../shared/types').Rule} */
module.exports = {
    meta: {
        type: "suggestion",

        docs: {
            description: "Enforce the use of variables within the scope they are defined",
            recommended: false,
            url: "https://eslint.org/docs/latest/rules/block-scoped-var"
        },

        schema: [],

        messages: {
            outOfScope: "'{{name}}' used outside of binding context."
        }
    },

    create(context) {
        let stack = [];
        const sourceCode = context.getSourceCode();

        /**
         * Makes a block scope.
         * @param {ASTNode} node A node of a scope.
         * @returns {void}
         */
        function enterScope(node) {
            stack.push(node.range);
        }

        /**
         * Pops the last block scope.
         * @returns {void}
         */
        function exitScope() {
            stack.pop();
        }

        /**
         * Reports a given reference.
         * @param {eslint-scope.Reference} reference A reference to report.
         * @returns {void}
         */
        function report(reference) {
            const identifier = reference.identifier;

            context.report({ node: identifier, messageId: "outOfScope", data: { name: identifier.name } });
        }

        /**
         * Finds and reports references which are outside of valid scopes.
         * @param {ASTNode} node A node to get variables.
         * @returns {void}
         */
        function checkForVariables(node) {
            if (node.kind !== "var") {
                return;
            }

            // Defines a predicate to check whether or not a given reference is outside of valid scope.
            const scopeRange = stack[stack.length - 1];

            /**
             * Check if a reference is out of scope
             * @param {ASTNode} reference node to examine
             * @returns {boolean} True is its outside the scope
             * @private
             */
            function isOutsideOfScope(reference) {
                const idRange = reference.identifier.range;

                return idRange[0] < scopeRange[0] || idRange[1] > scopeRange[1];
            }

            // Gets declared variables, and checks its references.
            const variables = sourceCode.getDeclaredVariables(node);

            for (let i = 0; i < variables.length; ++i) {

                // Reports.
                variables[i]
                    .references
                    .filter(isOutsideOfScope)
                    .forEach(report);
            }
        }

        return {
            Program(node) {
                stack = [node.range];
            },

            // Manages scopes.
            BlockStatement: enterScope,
            "BlockStatement:exit": exitScope,
            ForStatement: enterScope,
            "ForStatement:exit": exitScope,
            ForInStatement: enterScope,
            "ForInStatement:exit": exitScope,
            ForOfStatement: enterScope,
            "ForOfStatement:exit": exitScope,
            SwitchStatement: enterScope,
            "SwitchStatement:exit": exitScope,
            CatchClause: enterScope,
            "CatchClause:exit": exitScope,
            StaticBlock: enterScope,
            "StaticBlock:exit": exitScope,

            // Finds and reports references which are outside of valid scope.
            VariableDeclaration: checkForVariables
        };

    }
};
