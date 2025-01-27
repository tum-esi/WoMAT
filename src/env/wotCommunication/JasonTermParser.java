package wotCommunication;

import cartago.*;
import jason.asSyntax.*;
import jason.asSyntax.parser.TokenMgrError;

import java.util.HashMap;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;

/**
 * A helper class for parsing Jason Terms into Java objects (Map, List, String, Number, Boolean, null).
 */
public class JasonTermParser {

    /**
     * Parses a Jason Term into a Java object:
     * - If it's a numeric term (e.g. 2, 2.5), returns an Integer or Double
     * - If it's "true" or "false", returns Boolean
     * - If it's "null", returns null
     * - If it's a structure with multiple arguments, returns a Map
     *   keyed by functor if the structure is "key(value)", or a sub-map if more complex
     * - If it's a list, returns a Java List
     * - Otherwise returns a string
     */
    public static Object parseTerm(Term term) {
        // Numeric => int/double
        if (term.isNumeric()) {
            try {
                double d = ((NumberTerm) term).solve();
                if (d == (int) d) {
                    return (int) d;
                } else {
                    return d;
                }
            } catch (Exception e) {
                // fallback to string
                return term.toString();
            }
        }

        // Structures like object(...), or key(value)
        if (term.isStructure()) {
            Structure s = (Structure) term;
            int arity = s.getArity();

            // e.g., object(drinkId(cappuccino), size(l), quantity(2)) => we treat as Map
            if (arity > 0) {
                return parseMultiArgStructure(s);
            } else {
                // zero-arity structure => treat functor as a string
                return s.getFunctor();
            }
        }

        // List
        if (term.isList()) {
            List<Object> list = new ArrayList<>();
            ListTerm lt = (ListTerm) term;
            for (Term elem : lt) {
                list.add(parseTerm(elem));
            }
            return list;
        }

        // Atom/string => check for boolean or null keywords
        String valStr = term.toString().replace("\"", "").toLowerCase();
        if (valStr.equals("true")) {
            return true;
        } else if (valStr.equals("false")) {
            return false;
        } else if (valStr.equals("null")) {
            return null;
        } else {
            // default = string
            return term.toString().replace("\"", "");
        }
    }

    /**
     * Parse a structure with multiple arguments, e.g.:
     * object(drinkId(cappuccino), size(l), quantity(2))
     * or foo(bar(1), baz(2)).
     * 
     * - If each argument is shaped like key(value), store key->value in a map.
     * - If an argument has multiple sub-args, we parse it recursively in a sub-structure.
     */
    private static Map<String, Object> parseMultiArgStructure(Structure s) {
        Map<String, Object> map = new HashMap<>();
        int arity = s.getArity();

        // We ignore the top-level functor name for the map's keys, unless you want to store it
        // e.g. map.put("__functor", s.getFunctor());

        for (int i = 0; i < arity; i++) {
            Term arg = s.getTerm(i);
            if (arg.isStructure()) {
                Structure sub = (Structure) arg;
                String key = sub.getFunctor(); // e.g. "drinkId"
                int subArity = sub.getArity();

                // If sub-structure has exactly 1 argument => key(value)
                if (subArity == 1) {
                    Object valObj = parseTerm(sub.getTerm(0));
                    map.put(key, valObj);
                } else {
                    // sub has multiple arguments => parse recursively as a sub-map
                    // e.g. size(m, large)
                    map.put(key, parseTerm(sub));
                }
            } else {
                // If the argument is not a structure, we create a "default" key
                // or you can skip it
                map.put("field" + i, parseTerm(arg));
            }
        }
        return map;
    }
}
