"""Photo description cleanup and deterministic catalog matching with a fake provider."""
import os
import sys
import unittest
from unittest import mock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import ai
from photo_match import lab, delta_e, match_kind

BEADS = [
    {'id':'pink8','name':'粉晶','mm':8,'mat':'crystal','c':['#f8c5cc','#e8a9b3']},
    {'id':'pink10','name':'粉晶','mm':10,'mat':'crystal','c':['#f8c5cc','#e8a9b3']},
    {'id':'pinkstone','name':'粉石','mm':8,'mat':'stone','c':['#f8c5cc','#e8a9b3']},
    {'id':'silver','name':'银隔珠','mm':4,'mat':'metal','c':['#dddde0','#9999a0']},
]

def kind(role='main', **changes):
    value = {'role':role,'color':'#f8c5cc','colorName':'粉色','clarity':'translucent',
             'pattern':'plain','material':'crystal','mmGuess':8,'count':16,'confidence':.8}
    value.update(changes)
    return value

def photo_with(payload):
    class Provider:
        name='fake'
        def json(self, prompt, schema, image=None):
            assert '目录' not in prompt
            return payload
    with mock.patch.object(ai, 'provider', return_value=Provider()):
        return ai.photo(BEADS, None)

class PhotoTest(unittest.TestCase):
    def test_lab_and_delta_e(self):
        self.assertAlmostEqual(lab('#ffffff')[0], 100, places=2)
        self.assertLess(lab('#000000')[0], .01)
        self.assertEqual(delta_e('#abcdef','#abcdef'), 0)
        self.assertGreater(delta_e('#000000','#ffffff'), 99)

    def test_match_material_size_metal(self):
        self.assertEqual(match_kind(kind(), BEADS)[0]['id'], 'pink8')
        self.assertEqual(match_kind(kind(mmGuess=10), BEADS)[0]['id'], 'pink10')
        self.assertTrue(all(x['id']=='silver' for x in match_kind(kind('metal',color='#dddde0',material='metal'),BEADS)))

    def test_photo_contract(self):
        out=photo_with({'ok':True,'seen':'粉色主珠和银色隔珠','kinds':[kind(),kind('metal',color='#dddde0',material='metal')],
                        'layout':{'symmetric':False,'every':4,'sequence':['main','main','metal']}})
        self.assertTrue(out['ok'])
        self.assertEqual(out['main'],'pink8')
        self.assertEqual(out['metal'],'silver')
        self.assertEqual(out['every'],4)
        self.assertEqual(len(out['kinds'][0]['candidates']),3)

    def test_cleanup(self):
        out=photo_with({'ok':True,'seen':'粉色','kinds':[kind(mmGuess=50,count=-5,confidence='0.8'),
                         kind(role='wrong'),kind('accent',color='bad')],
                         'layout':{'symmetric':'yes','every':99,'sequence':['wrong','main']*40}})
        self.assertTrue(out['ok'])
        self.assertEqual(len(out['kinds']),1)
        self.assertIsNone(out['kinds'][0]['mmGuess'])
        self.assertEqual(out['kinds'][0]['count'],0)
        self.assertIsNone(out['kinds'][0]['confidence'])
        self.assertEqual(out['layout'],{'symmetric':False,'every':None,'sequence':['main']*15})

    def test_malformed_nested_values_do_not_crash(self):
        out=photo_with({'ok':True,'seen':'粉色','kinds':[kind(clarity=[],pattern={},material=[],confidence=float('nan'))],
                        'layout':{'sequence':[{},'main'],'every':True}})
        self.assertTrue(out['ok'])
        self.assertIsNone(out['kinds'][0]['confidence'])
        self.assertEqual(out['layout']['sequence'],['main'])

    def test_failure(self):
        out=photo_with({'ok':False,'seen':'','reason':'dark'})
        self.assertEqual(out['reason'],'dark')
        out=photo_with({'ok':True,'seen':'','kinds':[],'layout':{}})
        self.assertEqual(out['reason'],'unknown_beads')

if __name__=='__main__': unittest.main()
