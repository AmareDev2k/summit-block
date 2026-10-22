import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "build_rules", Path(__file__).resolve().parent.parent / "scripts" / "build-rules.py"
)
br = importlib.util.module_from_spec(spec)
spec.loader.exec_module(br)


class ParseLine(unittest.TestCase):
    def test_domain_rule(self):
        self.assertEqual(br.parse_line("||Example.com^"), ("domain", "example.com", False))

    def test_bare_domain(self):
        self.assertEqual(br.parse_line("ads.example.org"), ("domain", "ads.example.org", False))

    def test_third_party(self):
        self.assertEqual(br.parse_line("||t.example.com^$third-party"), ("domain", "t.example.com", True))

    def test_url_rule(self):
        self.assertEqual(br.parse_line("||example.com/ads/*.js"), ("url", "||example.com/ads/*.js", False))

    def test_comments_and_cosmetic_ignored(self):
        for line in ("", "! hi", "# hi", "[Adblock Plus 2.0]", "example.com##.banner"):
            self.assertIsNone(br.parse_line(line))

    def test_unsupported_option_raises(self):
        with self.assertRaises(ValueError):
            br.parse_line("||example.com^$popup")

    def test_garbage_raises(self):
        with self.assertRaises(ValueError):
            br.parse_line("not a rule at all")


class Compile(unittest.TestCase):
    def test_dedupe_and_chunking(self):
        lines = [f"||d{i}.example.com^" for i in range(250)] + ["||d1.example.com^"]
        rules = br.compile_rules(lines)
        self.assertEqual(len(rules), 3)  # 100 + 100 + 50
        self.assertEqual(sum(len(r["condition"]["requestDomains"]) for r in rules), 250)

    def test_ids_unique_and_no_main_frame(self):
        rules = br.compile_rules(["||a.com^", "||b.com^$third-party", "||c.com/x/"])
        self.assertEqual(len({r["id"] for r in rules}), len(rules))
        for r in rules:
            self.assertNotIn("main_frame", r["condition"]["resourceTypes"])

    def test_warnings_reported(self):
        warnings = []
        br.compile_rules(["||ok.com^", "garbage line"], "t.txt", warnings.append)
        self.assertEqual(len(warnings), 1)


if __name__ == "__main__":
    unittest.main()
