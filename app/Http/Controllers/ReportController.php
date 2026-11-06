<?php

namespace App\Http\Controllers;

use App\Services\ReportService;
use App\Support\ExerciseCatalog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** Reports: time per day, goal days, exercise results and vision tests for a period. */
class ReportController extends Controller
{
    public function index(Request $request, ReportService $reports): Response
    {
        $period = $reports->period($request->user(), $request->query('perioada'), $request->query('luna'));

        return Inertia::render('reports/Index', [
            'period' => [
                'key' => $period['key'],
                'label' => $period['label'],
                'from' => $period['from']->toDateString(),
                'to' => $period['to']->toDateString(),
                'month' => $request->query('luna'),
            ],
            'report' => $reports->build($request->user(), $period['from'], $period['to']),
            'titles' => collect([...array_keys(ExerciseCatalog::all()), 'test-vedere', 'balance', 'worth'])
                ->mapWithKeys(fn (string $key) => [$key => ExerciseCatalog::title($key)])
                ->all(),
        ]);
    }

    /** Download the days of the period as CSV (opens in Excel; ";" separator, UTF-8 BOM). */
    public function export(Request $request, ReportService $reports): StreamedResponse
    {
        $period = $reports->period($request->user(), $request->query('perioada'), $request->query('luna'));
        $rows = $reports->csvRows($request->user(), $period['from'], $period['to']);
        $name = 'lazyeyehealth-'.$period['from']->toDateString().'_'.$period['to']->toDateString().'.csv';

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");

            foreach ($rows as $row) {
                fputcsv($out, $row, ';', escape: '');
            }

            fclose($out);
        }, $name, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
